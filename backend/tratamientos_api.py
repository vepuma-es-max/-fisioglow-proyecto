
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

from tratamientos_schemas import (
    TratamientoCrear,
    TratamientoRespuesta
)


router = APIRouter(
    prefix="/api/v1/tratamientos",
    tags=["Tratamientos"]
)


def solicitar_supabase(
    tabla: str,
    metodo: str,
    token: str,
    parametros: dict | None = None,
    datos: dict | None = None
):
    if tabla not in ("planes_tratamiento", "evaluaciones"):
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
                    "No se pudo procesar el tratamiento. "
                    "Verifica los datos y las relaciones."
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


def token_autorizado(authorization: str):
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


@router.get(
    "",
    response_model=list[TratamientoRespuesta]
)
def listar_tratamientos(
    authorization: str = Header(...),
    usuario=Depends(verificar_rol)
):
    token = token_autorizado(authorization)

    return solicitar_supabase(
        tabla="planes_tratamiento",
        metodo="GET",
        token=token,
        parametros={
            "select": (
                "id,paciente_id,evaluacion_id,"
                "objetivo,fecha_inicio,estado"
            ),
            "order": "id.desc",
            "limit": "100"
        }
    )


@router.post(
    "",
    response_model=TratamientoRespuesta,
    status_code=status.HTTP_201_CREATED
)
def registrar_tratamiento(
    tratamiento: TratamientoCrear,
    authorization: str = Header(...),
    usuario=Depends(verificar_rol)
):
    token = token_autorizado(authorization)

    if tratamiento.evaluacion_id is not None:
        evaluaciones = solicitar_supabase(
            tabla="evaluaciones",
            metodo="GET",
            token=token,
            parametros={
                "select": "id",
                "id": f"eq.{tratamiento.evaluacion_id}",
                "paciente_id": (
                    f"eq.{tratamiento.paciente_id}"
                ),
                "limit": "1"
            }
        )

        if not evaluaciones:
            raise HTTPException(
                status_code=400,
                detail=(
                    "La evaluación seleccionada no existe "
                    "o no corresponde al paciente."
                )
            )

    resultado = solicitar_supabase(
        tabla="planes_tratamiento",
        metodo="POST",
        token=token,
        datos=tratamiento.model_dump(mode="json")
    )

    if not isinstance(resultado, list) or len(resultado) != 1:
        raise HTTPException(
            status_code=502,
            detail="No se pudo confirmar el tratamiento."
        )

    return resultado[0]
