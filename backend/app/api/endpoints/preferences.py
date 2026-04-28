from typing import cast

from fastapi import APIRouter, Body, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User

router = APIRouter(tags=["preferences"])


@router.get("/cuisines/")
def get_cuisine_preference(current_user: User = Depends(get_current_user)) -> str:
    preference = cast(str | None, current_user.cuisine_preference)
    return preference or ""


@router.put("/cuisines/")
def update_cuisine_preference(
    payload: str = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> str:
    setattr(current_user, "cuisine_preference", payload)
    db.commit()
    db.refresh(current_user)
    preference = cast(str | None, current_user.cuisine_preference)
    return preference or ""


@router.get("/dietary/")
def get_dietary_preference(current_user: User = Depends(get_current_user)) -> str:
    preference = cast(str | None, current_user.dietary_preference)
    return preference or ""


@router.put("/dietary/")
def update_dietary_preference(
    payload: str = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> str:
    setattr(current_user, "dietary_preference", payload)
    db.commit()
    db.refresh(current_user)
    preference = cast(str | None, current_user.dietary_preference)
    return preference or ""
