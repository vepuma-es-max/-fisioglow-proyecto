
import json
import urllib.request
import urllib.error

from fastapi import (
    APIRouter,
    Depends,
    Header,
    HTTPException,
    status
)

from citas_schemas import CitaCrear, CitaRespuesta
from security import (
    verificar_rol,
    SUPABASE_URL,
    SUPABASE_KEY
)

router = APIRouter(
    prefix="/api/v1",
    tags=["Citas y Fisioterapeutas"]
)


def consultar_supabase(
    tabla: str,
    metodo: str,
    token: str,
    parametros: str = "",
    datos: dict | None = None
):
    tablas_permitidas = {
        "citas",
        "fisioterapeutas"
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

    url = (
        f"{SUPABASE_URL}/rest/v1/"
        f"{tabla}{parametros}"
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
                    "Datos inválidos, relación inexistente "
                    "o conflicto de registro."
                )
            )

        raise HTTPException(
            status_code=502,
            detail="Error al consultar la base de datos."
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


@router.get("/fisioterapeutas")
def listar_fisioterapeutas(
    authorization: str = Header(...),
    usuario=Depends(verificar_rol)
):
    token = authorization.split(" ", 1)[1].strip()

    return consultar_supabase(
        tabla="fisioterapeutas",
        metodo="GET",
        token=token,
        parametros=(
            "?select=id,nombres,apellidos"
            "&order=apellidos.asc&limit=100"
        )
    )


@router.get(
    "/citas",
    response_model=list[CitaRespuesta]
)
def listar_citas(
    authorization: str = Header(...),
    usuario=Depends(verificar_rol)
):
    token = authorization.split(" ", 1)[1].strip()

    return consultar_supabase(
        tabla="citas",
        metodo="GET",
        token=token,
        parametros=(
            "?select=id,paciente_id,"
            "fisioterapeuta_id,fecha_hora,"
            "motivo,estado"
            "&order=fecha_hora.asc&limit=100"
        )
    )


@router.post(
    "/citas",
    response_model=CitaRespuesta,
    status_code=status.HTTP_201_CREATED
)
def registrar_cita(
    cita: CitaCrear,
    authorization: str = Header(...),
    usuario=Depends(verificar_rol)
):
    token = authorization.split(" ", 1)[1].strip()

    datos = cita.model_dump(mode="json")

    resultado = consultar_supabase(
        tabla="citas",
        metodo="POST",
        token=token,
        datos=datos
    )

    if (
        not isinstance(resultado, list)
        or len(resultado) != 1
    ):
        raise HTTPException(
            status_code=502,
            detail="No se pudo confirmar la cita."
        )

    return resultado[0]
