
from fastapi.middleware.cors import CORSMiddleware

from main import app

from pacientes_api import (
    router as pacientes_router
)

from citas_api import (
    router as citas_router
)

from evaluaciones_api import (
    router as evaluaciones_router
)

from tratamientos_api import (
    router as tratamientos_router
)

from sesiones_api import (
    router as sesiones_router
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://fisioglow-proyecto.vercel.app"
    ],
    allow_credentials=False,
    allow_methods=[
        "GET",
        "POST",
        "OPTIONS"
    ],
    allow_headers=[
        "Authorization",
        "Content-Type"
    ]
)

app.include_router(pacientes_router)
app.include_router(citas_router)
app.include_router(evaluaciones_router)
app.include_router(tratamientos_router)
app.include_router(sesiones_router)
