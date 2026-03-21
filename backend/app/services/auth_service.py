from typing import cast

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, normalize_email, verify_password
from app.models import User


def signup_user(db: Session, email: str, password: str) -> tuple[User, str]:
    normalized = normalize_email(email)
    existing_user = db.query(User).filter(User.email == normalized).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="Email is already in use")

    user = User(email=normalized, password_hash=hash_password(password))
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(cast(int, user.id), cast(str, user.email))
    return user, token


def login_user(db: Session, email: str, password: str) -> tuple[User, str]:
    normalized = normalize_email(email)
    user = db.query(User).filter(User.email == normalized).first()
    if not user or not verify_password(password, str(user.password_hash)):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(cast(int, user.id), cast(str, user.email))
    return user, token
