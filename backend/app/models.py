# app/models.py
from sqlalchemy import Column, Integer, String, Text
from .database import Base
import json

class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String(255), nullable=True)
    rating = Column(Integer, nullable=True)
    ingredients = Column(Text, nullable=True)
    steps = Column(Text, nullable=True)