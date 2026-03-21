from typing import cast

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import User, UserPlanItem
from app.services.recipe_service import get_accessible_recipe


def get_user_plan_ids(db: Session, user: User) -> list[int]:
    items = db.query(UserPlanItem).filter(UserPlanItem.user_id == user.id).all()
    return [cast(int, item.recipe_id) for item in items]


def add_recipe_to_plan(db: Session, user: User, recipe_id: int) -> dict[str, int]:
    recipe = get_accessible_recipe(db, user, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    existing_item = (
        db.query(UserPlanItem)
        .filter(UserPlanItem.user_id == user.id, UserPlanItem.recipe_id == recipe_id)
        .first()
    )
    if not existing_item:
        db.add(UserPlanItem(user_id=user.id, recipe_id=recipe_id))
        db.commit()

    return {"recipe_id": recipe_id}


def remove_recipe_from_plan(db: Session, user: User, recipe_id: int) -> dict[str, bool]:
    item = (
        db.query(UserPlanItem)
        .filter(UserPlanItem.user_id == user.id, UserPlanItem.recipe_id == recipe_id)
        .first()
    )
    if item:
        db.delete(item)
        db.commit()
    return {"deleted": True}
