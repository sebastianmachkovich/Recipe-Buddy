from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
import jwt
from fastapi import HTTPException, Response

AUTH_COOKIE_NAME = "recipe_buddy_access_token"
AUTH_ALGORITHM = "HS256"
AUTH_EXPIRES_HOURS = 24


def auth_secret() -> str:
    import os

    return os.getenv("AUTH_SECRET_KEY", "recipe-buddy-dev-secret-change-me")


def normalize_email(email: str) -> str:
    return email.strip().lower()


def hash_password(raw_password: str) -> str:
    return bcrypt.hashpw(raw_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(raw_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(raw_password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_access_token(user_id: int, email: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "email": email,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=AUTH_EXPIRES_HOURS)).timestamp()),
    }
    return jwt.encode(payload, auth_secret(), algorithm=AUTH_ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        payload: dict[str, Any] = jwt.decode(token, auth_secret(), algorithms=[AUTH_ALGORITHM])
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired authentication token") from exc
    return payload


def set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=AUTH_EXPIRES_HOURS * 60 * 60,
    )


def clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(key=AUTH_COOKIE_NAME)
