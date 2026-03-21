from typing import cast

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.core.security import clear_auth_cookie, set_auth_cookie
from app.database import get_db
from app.dependencies import get_current_user, get_optional_current_user
from app.models import User
from app.schemas.auth import AuthRequest, AuthUserResponse
from app.services.auth_service import login_user, signup_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=AuthUserResponse)
def signup(payload: AuthRequest, response: Response, db: Session = Depends(get_db)):
    user, token = signup_user(db, payload.email, payload.password)
    set_auth_cookie(response, token)
    return AuthUserResponse(id=cast(int, user.id), email=cast(str, user.email))


@router.post("/login", response_model=AuthUserResponse)
def login(payload: AuthRequest, response: Response, db: Session = Depends(get_db)):
    user, token = login_user(db, payload.email, payload.password)
    set_auth_cookie(response, token)
    return AuthUserResponse(id=cast(int, user.id), email=cast(str, user.email))


@router.post("/logout")
def logout(response: Response):
    clear_auth_cookie(response)
    return {"message": "Logged out"}


@router.get("/me", response_model=AuthUserResponse)
def auth_me(current_user: User = Depends(get_current_user)):
    return AuthUserResponse(id=cast(int, current_user.id), email=cast(str, current_user.email))


@router.get("/status")
def auth_status(current_user: User | None = Depends(get_optional_current_user)):
    if not current_user:
        return {"authenticated": False, "user": None}
    return {
        "authenticated": True,
        "user": {
            "id": cast(int, current_user.id),
            "email": cast(str, current_user.email),
        },
    }
