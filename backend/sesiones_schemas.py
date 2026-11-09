
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class SesionCrear(BaseModel):
    plan_id: int = Field(gt=0)
    fecha_sesion: datetime
    observaciones: str | None = Field(
        default=None,
        max_length=5000
    )
    estado: Literal[
        "programada",
        "realizada",
        "cancelada"
    ] = "programada"

    @field_validator("fecha_sesion")
    @classmethod
    def validar_fecha(cls, valor):
        if valor.tzinfo is None or valor.utcoffset() is None:
            raise ValueError(
                "La fecha y hora deben incluir zona horaria."
            )
        return valor


class SesionRespuesta(BaseModel):
    id: int
    plan_id: int
    fecha_sesion: datetime
    observaciones: str | None = None
    estado: str
