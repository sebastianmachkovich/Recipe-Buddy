from typing import Any, cast

from fastapi import HTTPException
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models import Recipe, User, UserRecipeOwnership
from app.schemas.recipe import RecipeWritePayload

MAX_RECIPE_IMAGE_BYTES = 5 * 1024 * 1024
ALLOWED_RECIPE_IMAGE_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}


def serialize_recipe(recipe: Recipe) -> dict[str, Any]:
    image_data = cast(bytes | None, recipe.image_data)
    return {
        "id": recipe.id,
        "name": recipe.name,
        "description": recipe.description,
        "imgUrl": recipe.imgUrl,
        "hasImage": image_data is not None,
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


def _assert_recipe_ownership(db: Session, user: User, recipe_id: int) -> Recipe:
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
    return recipe


def upload_recipe_image_for_user(
    db: Session,
    user: User,
    recipe_id: int,
    image_bytes: bytes,
    content_type: str,
    filename: str | None,
) -> dict[str, Any]:
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Image file is empty")

    if content_type not in ALLOWED_RECIPE_IMAGE_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported image type. Use JPEG, PNG, or WEBP.",
        )

    if len(image_bytes) > MAX_RECIPE_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image too large. Max size is 5 MB.")

    recipe = _assert_recipe_ownership(db, user, recipe_id)
    setattr(recipe, "image_data", image_bytes)
    setattr(recipe, "image_mime", content_type)
    setattr(recipe, "image_filename", filename)
    setattr(recipe, "image_size_bytes", len(image_bytes))
    db.commit()

    stored_filename = cast(str | None, recipe.image_filename)
    stored_mime = cast(str | None, recipe.image_mime)
    stored_size_bytes = cast(int | None, recipe.image_size_bytes)

    return {
        "recipe_id": recipe.id,
        "filename": stored_filename,
        "mime": stored_mime,
        "size_bytes": stored_size_bytes,
    }


def get_recipe_image_for_user(db: Session, user: User, recipe_id: int) -> tuple[bytes, str, str | None]:
    recipe = get_accessible_recipe(db, user, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    image_data = cast(bytes | None, recipe.image_data)
    image_mime = cast(str | None, recipe.image_mime)
    image_filename = cast(str | None, recipe.image_filename)

    if image_data is None or image_mime is None:
        raise HTTPException(status_code=404, detail="Recipe image not found")

    return image_data, image_mime, image_filename


def delete_recipe_image_for_user(db: Session, user: User, recipe_id: int) -> dict[str, bool]:
    recipe = _assert_recipe_ownership(db, user, recipe_id)
    image_data = cast(bytes | None, recipe.image_data)
    if image_data is None:
        raise HTTPException(status_code=404, detail="Recipe image not found")

    setattr(recipe, "image_data", None)
    setattr(recipe, "image_mime", None)
    setattr(recipe, "image_filename", None)
    setattr(recipe, "image_size_bytes", None)
    db.commit()

    return {"deleted": True}
