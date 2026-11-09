
import os
import json
import urllib.request
import urllib.error

from pathlib import Path
from uuid import UUID
from urllib.parse import quote

from dotenv import load_dotenv
from fastapi import Depends, Header, HTTPException

# Cargar la configuración privada del backend
ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(ENV_PATH)

SUPABASE_URL = os.getenv(
    "SUPABASE_URL", ""
).rstrip("/")

SUPABASE_KEY = os.getenv(
    "SUPABASE_PUBLISHABLE_KEY", ""
)

ROLES_AUTORIZADOS = {
    "administrador",
    "fisioterapeuta"
}


def consultar_supabase(url, token):
    """
    Realiza una consulta autenticada a Supabase.
    """

    request = urllib.request.Request(
        url,
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {token}",
            "Accept": "application/json"
        },
        method="GET"
    )

    try:
        with urllib.request.urlopen(
            request,
            timeout=15
        ) as response:
            return json.load(response)

    except urllib.error.HTTPError as error:
        if error.code in (401, 403):
            raise HTTPException(
                status_code=403,
                detail="Acceso no autorizado."
            )

        raise HTTPException(
            status_code=502,
            detail="Error al consultar Supabase."
        )

    except (urllib.error.URLError, TimeoutError):
        raise HTTPException(
            status_code=503,
            detail="Supabase no está disponible."
        )

    except (ValueError, json.JSONDecodeError):
        raise HTTPException(
            status_code=502,
            detail="Respuesta inválida de Supabase."
        )


def verificar_usuario(
    authorization: str | None = Header(default=None)
):
    """
    Comprueba que el usuario tenga una sesión válida.
    """

    if not SUPABASE_URL.startswith("https://"):
        raise HTTPException(
            status_code=503,
            detail="SUPABASE_URL no está configurada."
        )

    if not SUPABASE_KEY:
        raise HTTPException(
            status_code=503,
            detail="Falta la clave publicable."
        )

    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Debes iniciar sesión."
        )

    esquema, separador, token = authorization.partition(" ")

    if (
        esquema.lower() != "bearer"
        or not separador
        or not token.strip()
    ):
        raise HTTPException(
            status_code=401,
            detail="Token inválido."
        )

    token = token.strip()

    url = f"{SUPABASE_URL}/auth/v1/user"

    usuario = consultar_supabase(url, token)

    if not isinstance(usuario, dict):
        raise HTTPException(
            status_code=401,
            detail="Usuario inválido."
        )

    usuario_id = usuario.get("id")

    try:
        UUID(str(usuario_id))
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="Identificador de usuario inválido."
        )

    return {
        "id": usuario_id,
        "email": usuario.get("email"),
        "token": token
    }


def verificar_rol(
    usuario=Depends(verificar_usuario)
):
    """
    Autoriza únicamente a administradores
    y fisioterapeutas registrados.
    """

    usuario_id = quote(str(usuario["id"]), safe="")

    url = (
        f"{SUPABASE_URL}/rest/v1/perfiles"
        f"?id=eq.{usuario_id}"
        f"&select=id,rol"
    )

    perfiles = consultar_supabase(
        url,
        usuario["token"]
    )

    if not isinstance(perfiles, list):
        raise HTTPException(
            status_code=502,
            detail="Respuesta de perfiles inválida."
        )

    if len(perfiles) != 1:
        raise HTTPException(
            status_code=403,
            detail="No tienes un perfil autorizado."
        )

    rol = perfiles[0].get("rol")

    if rol not in ROLES_AUTORIZADOS:
        raise HTTPException(
            status_code=403,
            detail="No tienes permisos clínicos."
        )

    return {
        "id": usuario["id"],
        "email": usuario["email"],
        "rol": rol
    }
