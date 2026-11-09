
import json
import urllib.error
import urllib.request
from urllib.parse import urlencode

from fastapi import (
    APIRouter,
    Depends,
    Header,
    HTTPException,
    status
)

from security import (
    verificar_rol,
    SUPABASE_URL,
    SUPABASE_KEY
)

from sesiones_schemas import (
    SesionCrear,
    SesionRespuesta
)


router = APIRouter(
    prefix="/api/v1/sesiones",
    tags=["Sesiones de Rehabilitacion"]
)


def obtener_token(authorization: str):
    partes = authorization.split(" ", 1)

    if (
        len(partes) != 2
        or partes[0].lower() != "bearer"
        or not partes[1].strip()
    ):
        raise HTTPException(
            status_code=401,
            detail="Token de acceso inválido."
        )

    return partes[1].strip()


def consultar_supabase(
    tabla: str,
    metodo: str,
    token: str,
    parametros: dict | None = None,
    datos: dict | None = None
):
    tablas_permitidas = {
        "sesiones",
        "planes_tratamiento"
    }

    if tabla not in tablas_permitidas:
        raise HTTPException(
            status_code=400,
            detail="Tabla no permitida."
        )

    if not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(
            status_code=503,
            detail="Supabase no está configurado."
        )

    url = f"{SUPABASE_URL}/rest/v1/{tabla}"

    if parametros:
        url += "?" + urlencode(parametros)

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }

    contenido = None

    if metodo == "POST":
        headers["Content-Type"] = "application/json"
        headers["Prefer"] = "return=representation"

        contenido = json.dumps(
            datos
        ).encode("utf-8")

    solicitud = urllib.request.Request(
        url,
        headers=headers,
        data=contenido,
        method=metodo
    )

    try:
        with urllib.request.urlopen(
            solicitud,
            timeout=15
        ) as respuesta:
            cuerpo = respuesta.read()
            return json.loads(cuerpo) if cuerpo else []

    except urllib.error.HTTPError as error:
        if error.code in (401, 403):
            raise HTTPException(
                status_code=403,
                detail="No tienes permiso para esta operación."
            )

        if error.code in (400, 409, 422):
            raise HTTPException(
                status_code=400,
                detail=(
                    "No se pudo registrar la sesión. "
                    "Revisa el plan, estado y fecha."
                )
            )

        raise HTTPException(
            status_code=502,
            detail="Error al consultar Supabase."
        )

    except (urllib.error.URLError, TimeoutError):
        raise HTTPException(
            status_code=503,
            detail="No se pudo conectar con Supabase."
        )

    except (ValueError, TypeError):
        raise HTTPException(
            status_code=502,
            detail="Supabase devolvió una respuesta inválida."
        )


@router.get(
    "",
    response_model=list[SesionRespuesta]
)
def listar_sesiones(
    authorization: str = Header(...),
    usuario=Depends(verificar_rol)
):
    token = obtener_token(authorization)

    return consultar_supabase(
        tabla="sesiones",
        metodo="GET",
        token=token,
        parametros={
            "select": (
                "id,plan_id,fecha_sesion,"
                "observaciones,estado"
            ),
            "order": "fecha_sesion.desc",
            "limit": "100"
        }
    )


@router.post(
    "",
    response_model=SesionRespuesta,
    status_code=status.HTTP_201_CREATED
)
def registrar_sesion(
    sesion: SesionCrear,
    authorization: str = Header(...),
    usuario=Depends(verificar_rol)
):
    token = obtener_token(authorization)

    planes = consultar_supabase(
        tabla="planes_tratamiento",
        metodo="GET",
        token=token,
        parametros={
            "select": "id,estado",
            "id": f"eq.{sesion.plan_id}",
            "limit": "1"
        }
    )

    if not planes:
        raise HTTPException(
            status_code=400,
            detail="El plan de tratamiento no existe o no es accesible."
        )

    if planes[0]["estado"] == "finalizado":
        raise HTTPException(
            status_code=400,
            detail=(
                "No se puede registrar una nueva sesión "
                "en un tratamiento finalizado."
            )
        )

    resultado = consultar_supabase(
        tabla="sesiones",
        metodo="POST",
        token=token,
        datos=sesion.model_dump(mode="json")
    )

    if not isinstance(resultado, list) or len(resultado) != 1:
        raise HTTPException(
            status_code=502,
            detail="No se pudo confirmar el registro de la sesión."
        )

    return resultado[0]
