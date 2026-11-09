
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

from pacientes_schemas import (
    PacienteCrear,
    PacienteRespuesta
)

from security import (
    verificar_rol,
    SUPABASE_URL,
    SUPABASE_KEY
)

router = APIRouter(
    prefix="/api/v1/pacientes",
    tags=["Pacientes"]
)


def consultar_base_datos(
    metodo: str,
    authorization: str,
    datos=None
):
    """
    Consulta Supabase usando el token del usuario.
    Las políticas RLS siguen aplicándose.
    """

    url = f"{SUPABASE_URL}/rest/v1/pacientes"

    if metodo == "GET":
        url += (
            "?select=id,nombres,apellidos,"
            "fecha_nacimiento,telefono,fecha_registro"
            "&order=id.desc&limit=100"
        )

    contenido = None

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": authorization,
        "Accept": "application/json"
    }

    if metodo == "POST":
        headers["Content-Type"] = "application/json"
        headers["Prefer"] = "return=representation"

        contenido = json.dumps(
            datos
        ).encode("utf-8")

    request = urllib.request.Request(
        url,
        data=contenido,
        headers=headers,
        method=metodo
    )

    try:
        with urllib.request.urlopen(
            request,
            timeout=15
        ) as response:
            respuesta = response.read()

            return (
                json.loads(respuesta)
                if respuesta else []
            )

    except urllib.error.HTTPError as error:
        if error.code in (401, 403):
            raise HTTPException(
                status_code=403,
                detail="Acceso a pacientes denegado."
            )

        if error.code in (400, 409, 422):
            raise HTTPException(
                status_code=400,
                detail="Los datos no cumplen las reglas de la base de datos."
            )

        raise HTTPException(
            status_code=502,
            detail="No se pudo completar la operación en Supabase."
        )

    except (urllib.error.URLError, TimeoutError):
        raise HTTPException(
            status_code=503,
            detail="No se pudo conectar con Supabase."
        )

    except (ValueError, TypeError):
        raise HTTPException(
            status_code=502,
            detail="Respuesta inválida de la base de datos."
        )


@router.get(
    "",
    response_model=list[PacienteRespuesta]
)
def listar_pacientes(
    authorization: str = Header(...),
    usuario=Depends(verificar_rol)
):
    """
    Consulta un máximo de 100 pacientes.
    Solo usuarios con roles autorizados.
    """

    return consultar_base_datos(
        metodo="GET",
        authorization=authorization
    )


@router.post(
    "",
    response_model=PacienteRespuesta,
    status_code=status.HTTP_201_CREATED
)
def registrar_paciente(
    paciente: PacienteCrear,
    authorization: str = Header(...),
    usuario=Depends(verificar_rol)
):
    """
    Registra un paciente de demostración.
    El identificador se genera en PostgreSQL.
    """

    datos = paciente.model_dump(mode="json")

    resultado = consultar_base_datos(
        metodo="POST",
        authorization=authorization,
        datos=datos
    )

    if not isinstance(resultado, list) or len(resultado) != 1:
        raise HTTPException(
            status_code=502,
            detail="No se pudo confirmar el registro."
        )

    return resultado[0]
