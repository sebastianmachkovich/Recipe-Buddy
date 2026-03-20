# app/models.py
from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from .database import Base
import json

class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    imgUrl = Column(String(255), nullable=True)
    rating = Column(Integer, nullable=True)
    ingredients = Column(JSONB, nullable=True)
    steps = Column(JSONB, nullable=True) 