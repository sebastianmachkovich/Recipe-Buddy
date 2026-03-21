from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.services.plan_service import add_recipe_to_plan, get_user_plan_ids, remove_recipe_from_plan

router = APIRouter(prefix="/plan", tags=["plan"])


@router.get("/")
def get_user_plan(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_user_plan_ids(db, current_user)


@router.post("/{recipe_id}")
def add_to_user_plan(
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return add_recipe_to_plan(db, current_user, recipe_id)


@router.delete("/{recipe_id}")
def remove_from_user_plan(
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return remove_recipe_from_plan(db, current_user, recipe_id)
