
from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class TratamientoCrear(BaseModel):
    paciente_id: int = Field(gt=0)
    evaluacion_id: int | None = Field(default=None, gt=0)
    objetivo: str = Field(min_length=3, max_length=3000)
    fecha_inicio: date
    estado: Literal[
        "activo",
        "pausado",
        "finalizado"
    ] = "activo"

    @model_validator(mode="after")
    def validar_objetivo(self):
        self.objetivo = self.objetivo.strip()

        if len(self.objetivo) < 3:
            raise ValueError(
                "Escribe un objetivo terapéutico válido."
            )

        return self


class TratamientoRespuesta(BaseModel):
    id: int
    paciente_id: int
    evaluacion_id: int | None = None
    objetivo: str
    fecha_inicio: date
    estado: str
