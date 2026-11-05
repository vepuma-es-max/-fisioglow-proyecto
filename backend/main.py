from fastapi import FastAPI, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import get_db


app = FastAPI(
    title="API de Catálogo FisioGlow",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "https://fisioglow-proyecto.vercel.app",
],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "API FisioGlow funcionando"}


@app.get(
    "/api/v1/products",
    response_model=List[schemas.ProductResponse]
)
def list_products(db: Session = Depends(get_db)):
    return db.query(models.Product).all()


@app.post(
    "/api/v1/products",
    response_model=schemas.ProductResponse,
    status_code=status.HTTP_201_CREATED
)
def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db)
):
    nuevo = models.Product(**product.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo