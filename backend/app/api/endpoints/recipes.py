from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.schemas.recipe import RecipeWritePayload
from app.services.recipe_service import (
    create_recipe_for_user,
    delete_recipe_for_user,
    get_recipe_by_id,
    list_random_recipes,
    list_recipes,
    update_recipe_for_user,
)

router = APIRouter(prefix="/recipes", tags=["recipes"])


@router.get("/")
def get_recipes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return list_recipes(db, current_user)


@router.get("/random")
def get_random_recipes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return list_random_recipes(db, current_user)


@router.get("/{id}")
def get_recipe(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_recipe_by_id(db, current_user, id)


@router.post("/")
def create_recipe(
    payload: RecipeWritePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_recipe_for_user(db, current_user, payload)


@router.put("/{id}")
def update_recipe(
    id: int,
    payload: RecipeWritePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update_recipe_for_user(db, current_user, id, payload)


@router.delete("/{id}")
def delete_recipe(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return delete_recipe_for_user(db, current_user, id)
