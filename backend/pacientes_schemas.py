
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field


class PacienteCrear(BaseModel):
    nombres: str = Field(min_length=1, max_length=100)
    apellidos: str = Field(min_length=1, max_length=100)
    fecha_nacimiento: date | None = None
    telefono: str | None = Field(
        default=None,
        max_length=30
    )


class PacienteRespuesta(PacienteCrear):
    id: int
    fecha_registro: datetime

    model_config = ConfigDict(from_attributes=True)
