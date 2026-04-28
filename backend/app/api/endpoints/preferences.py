from typing import cast

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.schemas.preferences import PreferencePayload, PreferenceResponse

router = APIRouter(tags=["preferences"])


def _read_preference(value: object) -> PreferenceResponse:
    return PreferenceResponse(value=cast(str | None, value) or "")


@router.get("/cuisines/", response_model=PreferenceResponse)
def get_cuisine_preference(current_user: User = Depends(get_current_user)) -> PreferenceResponse:
    return _read_preference(current_user.cuisine_preference)


@router.put("/cuisines/", response_model=PreferenceResponse)
def update_cuisine_preference(
    payload: PreferencePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PreferenceResponse:
    setattr(current_user, "cuisine_preference", payload.value)
    db.commit()
    db.refresh(current_user)
    return _read_preference(current_user.cuisine_preference)


@router.get("/dietary/", response_model=PreferenceResponse)
def get_dietary_preference(current_user: User = Depends(get_current_user)) -> PreferenceResponse:
    return _read_preference(current_user.dietary_preference)


@router.put("/dietary/", response_model=PreferenceResponse)
def update_dietary_preference(
    payload: PreferencePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PreferenceResponse:
    setattr(current_user, "dietary_preference", payload.value)
    db.commit()
    db.refresh(current_user)
    return _read_preference(current_user.dietary_preference)
