
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class CitaCrear(BaseModel):
    paciente_id: int = Field(gt=0)
    fisioterapeuta_id: int = Field(gt=0)
    fecha_hora: datetime
    motivo: str | None = Field(
        default=None,
        max_length=500
    )

    @field_validator("fecha_hora")
    @classmethod
    def validar_fecha(cls, valor):
        if valor.tzinfo is None or valor.utcoffset() is None:
            raise ValueError(
                "La fecha y hora deben incluir zona horaria."
            )

        if valor <= datetime.now(valor.tzinfo):
            raise ValueError(
                "La cita debe programarse para una fecha futura."
            )

        return valor


class CitaRespuesta(BaseModel):
    id: int
    paciente_id: int
    fisioterapeuta_id: int
    fecha_hora: datetime
    motivo: str | None = None
    estado: str
