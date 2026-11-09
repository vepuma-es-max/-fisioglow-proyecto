
from fastapi.middleware.cors import CORSMiddleware

from main import app

from pacientes_api import router as pacientes_router
from citas_api import router as citas_router
from evaluaciones_api import router as evaluaciones_router
from tratamientos_api import router as tratamientos_router
from sesiones_api import router as sesiones_router


# Dominios autorizados de FISIOGLOW.
ORIGENES_PERMITIDOS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://fisioglow-proyecto.vercel.app",
]

# Permite las vistas previas de este proyecto en Vercel,
# sin autorizar indiscriminadamente todos los dominios.
REGEX_VERCEL = (
    r"^https://fisioglow-proyecto"
    r"-[a-zA-Z0-9-]+"
    r"-vepuma-es-max\.vercel\.app$"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGENES_PERMITIDOS,
    allow_origin_regex=REGEX_VERCEL,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Módulos clínicos de FISIOGLOW 2.0.
app.include_router(pacientes_router)
app.include_router(citas_router)
app.include_router(evaluaciones_router)
app.include_router(tratamientos_router)
app.include_router(sesiones_router)
