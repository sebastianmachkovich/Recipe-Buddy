# app/models.py
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from .database import Base
from sqlalchemy.sql import func

class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    imgUrl = Column(Text, nullable=True)
    rating = Column(Integer, nullable=True)
    inPlan = Column(Boolean, nullable=False)
    ingredients = Column(JSONB, nullable=True)
    steps = Column(JSONB, nullable=True) 


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    cuisine_preference = Column(Text, nullable=True)
    dietary_preference = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class UserPlanItem(Base):
    __tablename__ = "user_plan_items"
    __table_args__ = (
        UniqueConstraint("user_id", "recipe_id", name="uq_user_plan_recipe"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class UserRecipeOwnership(Base):
    __tablename__ = "user_recipe_ownership"
    __table_args__ = (
        UniqueConstraint("recipe_id", name="uq_recipe_owner"),
        UniqueConstraint("user_id", "recipe_id", name="uq_user_owned_recipe"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
