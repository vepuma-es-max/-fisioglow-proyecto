
from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class EvaluacionCrear(BaseModel):
    paciente_id: int = Field(gt=0)
    fisioterapeuta_id: int = Field(gt=0)
    fecha_evaluacion: datetime
    motivo_consulta: str | None = Field(
        default=None,
        max_length=2000
    )
    observaciones: str | None = Field(
        default=None,
        max_length=5000
    )

    @field_validator("fecha_evaluacion")
    @classmethod
    def validar_fecha(cls, valor):
        if valor.tzinfo is None or valor.utcoffset() is None:
            raise ValueError(
                "La fecha debe incluir zona horaria."
            )
        return valor


class EvaluacionRespuesta(BaseModel):
    id: int
    paciente_id: int
    fisioterapeuta_id: int
    fecha_evaluacion: datetime
    motivo_consulta: str | None = None
    observaciones: str | None = None
