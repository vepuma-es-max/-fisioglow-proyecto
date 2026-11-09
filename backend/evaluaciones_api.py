
import json
import urllib.error
import urllib.request

from fastapi import (
    APIRouter,
    Depends,
    Header,
    HTTPException,
    status
)

from evaluaciones_schemas import (
    EvaluacionCrear,
    EvaluacionRespuesta
)

from security import (
    verificar_rol,
    SUPABASE_URL,
    SUPABASE_KEY
)


router = APIRouter(
    prefix="/api/v1/evaluaciones",
    tags=["Evaluaciones Fisioterapéuticas"]
)


def solicitar_supabase(
    metodo: str,
    token: str,
    parametros: str = "",
    datos: dict | None = None
):
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(
            status_code=503,
            detail="Supabase no está configurado."
        )

    url = (
        f"{SUPABASE_URL}/rest/v1/"
        f"evaluaciones{parametros}"
    )

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

            return (
                json.loads(cuerpo)
                if cuerpo else []
            )

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
                    "No se pudo guardar la evaluación. "
                    "Verifica los campos y las relaciones."
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
            detail="Respuesta inválida de Supabase."
        )


@router.get(
    "",
    response_model=list[EvaluacionRespuesta]
)
def listar_evaluaciones(
    authorization: str = Header(...),
    usuario=Depends(verificar_rol)
):
    token = authorization.split(" ", 1)[1].strip()

    return solicitar_supabase(
        metodo="GET",
        token=token,
        parametros=(
            "?select=id,paciente_id,"
            "fisioterapeuta_id,fecha_evaluacion,"
            "motivo_consulta,observaciones"
            "&order=fecha_evaluacion.desc"
            "&limit=100"
        )
    )


@router.post(
    "",
    response_model=EvaluacionRespuesta,
    status_code=status.HTTP_201_CREATED
)
def registrar_evaluacion(
    evaluacion: EvaluacionCrear,
    authorization: str = Header(...),
    usuario=Depends(verificar_rol)
):
    token = authorization.split(" ", 1)[1].strip()

    resultado = solicitar_supabase(
        metodo="POST",
        token=token,
        datos=evaluacion.model_dump(mode="json")
    )

    if (
        not isinstance(resultado, list)
        or len(resultado) != 1
    ):
        raise HTTPException(
            status_code=502,
            detail="No se pudo confirmar el registro."
        )

    return resultado[0]
