from sqlalchemy import Column, BigInteger, Text, Numeric, Integer
from database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(Text, nullable=False)
    price = Column(Numeric, nullable=False)
    stock = Column(Integer, default=0)
    image_url = Column(Text, nullable=True)