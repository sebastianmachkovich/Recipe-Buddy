from typing import Any

from fastapi import HTTPException
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models import Recipe, User, UserRecipeOwnership
from app.schemas.recipe import RecipeWritePayload


def serialize_recipe(recipe: Recipe) -> dict[str, Any]:
    return {
        "id": recipe.id,
        "name": recipe.name,
        "description": recipe.description,
        "imgUrl": recipe.imgUrl,
        "rating": recipe.rating,
        "ingredients": recipe.ingredients or [],
        "steps": recipe.steps or [],
    }


def get_accessible_recipe(db: Session, user: User, recipe_id: int) -> Recipe | None:
    owned = (
        db.query(Recipe)
        .join(UserRecipeOwnership, UserRecipeOwnership.recipe_id == Recipe.id)
        .filter(Recipe.id == recipe_id, UserRecipeOwnership.user_id == user.id)
        .first()
    )
    if owned:
        return owned
    return (
        db.query(Recipe)
        .outerjoin(UserRecipeOwnership, UserRecipeOwnership.recipe_id == Recipe.id)
        .filter(Recipe.id == recipe_id, UserRecipeOwnership.id.is_(None))
        .first()
    )


def list_recipes(db: Session, user: User) -> list[dict[str, Any]]:
    recipes = (
        db.query(Recipe)
        .outerjoin(UserRecipeOwnership, UserRecipeOwnership.recipe_id == Recipe.id)
        .filter(or_(UserRecipeOwnership.user_id == user.id, UserRecipeOwnership.id.is_(None)))
        .all()
    )
    return [serialize_recipe(recipe) for recipe in recipes]


def list_random_recipes(db: Session, user: User) -> list[dict[str, Any]]:
    recipes = (
        db.query(Recipe)
        .outerjoin(UserRecipeOwnership, UserRecipeOwnership.recipe_id == Recipe.id)
        .filter(or_(UserRecipeOwnership.user_id == user.id, UserRecipeOwnership.id.is_(None)))
        .order_by(func.random())
        .limit(3)
        .all()
    )
    return [serialize_recipe(recipe) for recipe in recipes]


def get_recipe_by_id(db: Session, user: User, recipe_id: int) -> dict[str, Any]:
    recipe = get_accessible_recipe(db, user, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return serialize_recipe(recipe)


def create_recipe_for_user(db: Session, user: User, payload: RecipeWritePayload) -> dict[str, Any]:
    recipe = Recipe(
        name=payload.name,
        description=payload.description,
        imgUrl=payload.imgUrl,
        rating=payload.rating,
        ingredients=[item.model_dump() for item in payload.ingredients],
        steps=[item.model_dump() for item in payload.steps],
    )
    db.add(recipe)
    db.commit()
    db.refresh(recipe)

    ownership = UserRecipeOwnership(user_id=user.id, recipe_id=recipe.id)
    db.add(ownership)
    db.commit()

    return serialize_recipe(recipe)


def update_recipe_for_user(db: Session, user: User, recipe_id: int, payload: RecipeWritePayload) -> dict[str, Any]:
    ownership = (
        db.query(UserRecipeOwnership)
        .filter(UserRecipeOwnership.recipe_id == recipe_id, UserRecipeOwnership.user_id == user.id)
        .first()
    )
    if not ownership:
        raise HTTPException(status_code=403, detail="You can only edit recipes you own")

    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    setattr(recipe, "name", payload.name)
    setattr(recipe, "description", payload.description)
    setattr(recipe, "imgUrl", payload.imgUrl)
    setattr(recipe, "rating", payload.rating)
    setattr(recipe, "ingredients", [item.model_dump() for item in payload.ingredients])
    setattr(recipe, "steps", [item.model_dump() for item in payload.steps])
    db.commit()
    db.refresh(recipe)
    return serialize_recipe(recipe)


def delete_recipe_for_user(db: Session, user: User, recipe_id: int) -> dict[str, bool]:
    ownership = (
        db.query(UserRecipeOwnership)
        .filter(UserRecipeOwnership.recipe_id == recipe_id, UserRecipeOwnership.user_id == user.id)
        .first()
    )
    if not ownership:
        raise HTTPException(status_code=403, detail="You can only delete recipes you own")

    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    db.delete(ownership)
    db.delete(recipe)
    db.commit()
    return {"deleted": True}
