"""Recipe Buddy FastAPI Application - Minimal Setup."""


from datetime import datetime, timedelta, timezone

import base64
import json
import os
import re
from typing import Any, cast

import bcrypt
import httpx
import jwt
from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ValidationError
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from app.database import Base, engine, get_db
from app.models import Recipe, User, UserPlanItem, UserRecipeOwnership

# Create tables if they don't exist.
Base.metadata.create_all(bind=engine)

AUTH_COOKIE_NAME = "recipe_buddy_access_token"
AUTH_ALGORITHM = "HS256"
AUTH_EXPIRES_HOURS = 24
AUTH_SECRET = os.getenv("AUTH_SECRET_KEY", "recipe-buddy-dev-secret-change-me")

# Initialize FastAPI app
app = FastAPI(
    title="Recipe Buddy API",
    description="AI-powered recipe suggestion API",
    version="1.0.0"
)

# Configure CORS to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    """Root endpoint."""
    return {
        "message": "Welcome to Recipe Buddy API",
        "status": "running",
        "docs": "/docs",
    }

@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "database": "ready"}

@app.get("/api/test")
def test_endpoint():
    """Test endpoint to verify API is working."""
    return {"message": "API is working! Start building your features here."}

class AuthRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=6, max_length=128)


class AuthUserResponse(BaseModel):
    id: int
    email: str


class RecipeIngredientPayload(BaseModel):
    id: int
    name: str
    amount: float | int
    unit: str | None = None


class RecipeStepPayload(BaseModel):
    id: int
    description: str
    time: dict[str, int] | None = None


class RecipeWritePayload(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    imgUrl: str | None = None
    rating: int | None = Field(default=0, ge=0, le=5)
    ingredients: list[RecipeIngredientPayload] = Field(default_factory=list)
    steps: list[RecipeStepPayload] = Field(default_factory=list)


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _hash_password(raw_password: str) -> str:
    return bcrypt.hashpw(raw_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(raw_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(raw_password.encode("utf-8"), hashed_password.encode("utf-8"))


def _create_access_token(user: User) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=AUTH_EXPIRES_HOURS)).timestamp()),
    }
    return jwt.encode(payload, AUTH_SECRET, algorithm=AUTH_ALGORITHM)


def _decode_access_token(token: str) -> dict[str, Any]:
    try:
        payload: dict[str, Any] = jwt.decode(token, AUTH_SECRET, algorithms=[AUTH_ALGORITHM])
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired authentication token") from exc
    return payload


def _set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=AUTH_EXPIRES_HOURS * 60 * 60,
    )


def _clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(key=AUTH_COOKIE_NAME)


def _serialize_recipe(recipe: Recipe) -> dict[str, Any]:
    return {
        "id": recipe.id,
        "name": recipe.name,
        "description": recipe.description,
        "imgUrl": recipe.imgUrl,
        "rating": recipe.rating,
        "ingredients": recipe.ingredients or [],
        "steps": recipe.steps or [],
    }


def _get_accessible_recipe(db: Session, user: User, recipe_id: int) -> Recipe | None:
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


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get(AUTH_COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")

    payload = _decode_access_token(token)
    raw_user_id = payload.get("sub")
    if raw_user_id is None:
        raise HTTPException(status_code=401, detail="Invalid authentication token")

    user = db.query(User).filter(User.id == int(raw_user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def get_optional_current_user(request: Request, db: Session = Depends(get_db)) -> User | None:
    token = request.cookies.get(AUTH_COOKIE_NAME)
    if not token:
        return None

    try:
        payload = _decode_access_token(token)
    except HTTPException:
        return None

    raw_user_id = payload.get("sub")
    if raw_user_id is None:
        return None

    user = db.query(User).filter(User.id == int(raw_user_id)).first()
    return user


@app.post("/auth/signup", response_model=AuthUserResponse)
def signup(payload: AuthRequest, response: Response, db: Session = Depends(get_db)):
    email = _normalize_email(payload.email)
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="Email is already in use")

    user = User(email=email, password_hash=_hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    token = _create_access_token(user)
    _set_auth_cookie(response, token)
    return AuthUserResponse(id=cast(int, user.id), email=cast(str, user.email))


@app.post("/auth/login", response_model=AuthUserResponse)
def login(payload: AuthRequest, response: Response, db: Session = Depends(get_db)):
    email = _normalize_email(payload.email)
    user = db.query(User).filter(User.email == email).first()
    if not user or not _verify_password(payload.password, str(user.password_hash)):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = _create_access_token(user)
    _set_auth_cookie(response, token)
    return AuthUserResponse(id=cast(int, user.id), email=cast(str, user.email))


@app.post("/auth/logout")
def logout(response: Response):
    _clear_auth_cookie(response)
    return {"message": "Logged out"}


@app.get("/auth/me", response_model=AuthUserResponse)
def auth_me(current_user: User = Depends(get_current_user)):
    return AuthUserResponse(id=cast(int, current_user.id), email=cast(str, current_user.email))


@app.get("/auth/status")
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


@app.get("/recipes/")
def get_recipes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    recipes = (
        db.query(Recipe)
        .outerjoin(UserRecipeOwnership, UserRecipeOwnership.recipe_id == Recipe.id)
        .filter(or_(UserRecipeOwnership.user_id == current_user.id, UserRecipeOwnership.id.is_(None)))
        .all()
    )
    return [_serialize_recipe(recipe) for recipe in recipes]


@app.get("/recipes/random")
def get_random_recipes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    recipes = (
        db.query(Recipe)
        .outerjoin(UserRecipeOwnership, UserRecipeOwnership.recipe_id == Recipe.id)
        .filter(or_(UserRecipeOwnership.user_id == current_user.id, UserRecipeOwnership.id.is_(None)))
        .order_by(func.random())
        .limit(3)
        .all()
    )
    return [_serialize_recipe(recipe) for recipe in recipes]


@app.get("/recipes/{id}")
def get_recipe(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    recipe = _get_accessible_recipe(db, current_user, id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return _serialize_recipe(recipe)


@app.post("/recipes/")
def create_recipe(
    payload: RecipeWritePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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

    ownership = UserRecipeOwnership(user_id=current_user.id, recipe_id=recipe.id)
    db.add(ownership)
    db.commit()

    return _serialize_recipe(recipe)


@app.put("/recipes/{id}")
def update_recipe(
    id: int,
    payload: RecipeWritePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ownership = (
        db.query(UserRecipeOwnership)
        .filter(UserRecipeOwnership.recipe_id == id, UserRecipeOwnership.user_id == current_user.id)
        .first()
    )
    if not ownership:
        raise HTTPException(status_code=403, detail="You can only edit recipes you own")

    recipe = db.query(Recipe).filter(Recipe.id == id).first()
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
    return _serialize_recipe(recipe)


@app.delete("/recipes/{id}")
def delete_recipe(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ownership = (
        db.query(UserRecipeOwnership)
        .filter(UserRecipeOwnership.recipe_id == id, UserRecipeOwnership.user_id == current_user.id)
        .first()
    )
    if not ownership:
        raise HTTPException(status_code=403, detail="You can only delete recipes you own")

    recipe = db.query(Recipe).filter(Recipe.id == id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    db.delete(ownership)
    db.delete(recipe)
    db.commit()
    return {"deleted": True}


@app.get("/plan/")
def get_user_plan(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    items = db.query(UserPlanItem).filter(UserPlanItem.user_id == current_user.id).all()
    return [item.recipe_id for item in items]


@app.post("/plan/{recipe_id}")
def add_to_user_plan(
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    recipe = _get_accessible_recipe(db, current_user, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    existing_item = (
        db.query(UserPlanItem)
        .filter(UserPlanItem.user_id == current_user.id, UserPlanItem.recipe_id == recipe_id)
        .first()
    )
    if not existing_item:
        db.add(UserPlanItem(user_id=current_user.id, recipe_id=recipe_id))
        db.commit()

    return {"recipe_id": recipe_id}


@app.delete("/plan/{recipe_id}")
def remove_from_user_plan(
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = (
        db.query(UserPlanItem)
        .filter(UserPlanItem.user_id == current_user.id, UserPlanItem.recipe_id == recipe_id)
        .first()
    )
    if item:
        db.delete(item)
        db.commit()
    return {"deleted": True}



class AIRecipeRequest(BaseModel):
    ingredients: list[str] | str
    max_recipes: int = Field(default=5, ge=1, le=10)
    cuisine_preference: str | None = None
    dietary_preference: str | None = None


class AIRecipe(BaseModel):
    name: str
    description: str
    ingredients: list[str]
    steps: list[str]
    prep_time_minutes: int | None = None
    cook_time_minutes: int | None = None


class AIRecipeResponse(BaseModel):
    recipes: list[AIRecipe]
    model: str


class AIImageRecipeResponse(BaseModel):
    detected_ingredients: list[str]
    recipes: list[AIRecipe]
    vision_model: str
    recipe_model: str


def _normalize_ingredients(raw_ingredients: list[str] | str) -> list[str]:
    if isinstance(raw_ingredients, str):
        values = [item.strip() for item in re.split(r"[,\n]", raw_ingredients)]
    else:
        values = [item.strip() for item in raw_ingredients]
    normalized: list[str] = []
    seen = set()
    for item in values:
        key = item.lower()
        if not item or key in seen:
            continue
        seen.add(key)
        normalized.append(item)
    return normalized


def _strip_markdown_fences(text_value: str) -> str:
    stripped = text_value.strip()
    if stripped.startswith("```"):
        stripped = re.sub(r"^```(?:json)?", "", stripped).strip()
        stripped = re.sub(r"```$", "", stripped).strip()
    return stripped


def _extract_ingredients_list(content: str) -> list[str]:
    cleaned = _strip_markdown_fences(content)

    try:
        parsed_json = json.loads(cleaned)
    except json.JSONDecodeError:
        parsed_json = None

    raw_items: list[str] = []
    if isinstance(parsed_json, dict):
        if isinstance(parsed_json.get("ingredients"), list):
            raw_items = [str(item).strip() for item in parsed_json["ingredients"]]
    elif isinstance(parsed_json, list):
        raw_items = [str(item).strip() for item in parsed_json]

    if not raw_items:
        raw_items = [item.strip() for item in re.split(r"[,\n]", cleaned)]

    deduped: list[str] = []
    seen = set()
    for item in raw_items:
        if not item:
            continue
        normalized = re.sub(r"^[\-\d\).\s]+", "", item).strip()
        if not normalized:
            continue
        key = normalized.lower()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(normalized)

    return deduped


def _normalize_detected_ingredient_name(item: str) -> str:
    value = item.strip().lower()
    value = re.sub(r"\(.*?\)", "", value)
    value = re.sub(r"\b(chopped|diced|minced|sliced|fresh|raw|ripe|large|small|whole)\b", "", value)
    value = re.sub(r"\s+", " ", value).strip(" ,.-")

    synonym_map = {
        "tomatoes": "tomato",
        "cherry tomatoes": "tomato",
        "red onion": "onion",
        "white onion": "onion",
        "spring onion": "green onion",
        "scallions": "green onion",
        "bell peppers": "bell pepper",
        "capsicum": "bell pepper",
        "potatoes": "potato",
        "chillies": "chili",
        "chili peppers": "chili",
        "garlic cloves": "garlic",
    }
    value = synonym_map.get(value, value)
    return value


def _postprocess_detected_ingredients(values: list[str]) -> list[str]:
    ignore_terms = {
        "food",
        "dish",
        "meal",
        "plate",
        "bowl",
        "spoon",
        "fork",
        "knife",
        "pan",
        "pot",
        "container",
        "ingredient",
    }

    cleaned: list[str] = []
    seen = set()
    for item in values:
        normalized = _normalize_detected_ingredient_name(item)
        if not normalized or normalized in ignore_terms:
            continue
        if len(normalized) < 2:
            continue
        if normalized in seen:
            continue
        seen.add(normalized)
        cleaned.append(normalized)

    return cleaned


async def _generate_recipes_with_groq(payload: AIRecipeRequest, ingredients: list[str]) -> AIRecipeResponse:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="GROQ_API_KEY is not configured on the backend.",
        )

    model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
    system_prompt = (
        "You are a recipe generator. "
        "Always return valid JSON only with this exact schema: "
        "{\"recipes\": [{\"name\": string, \"description\": string, \"ingredients\": string[], \"steps\": string[], "
        "\"prep_time_minutes\": number|null, \"cook_time_minutes\": number|null}]}. "
        "Do not include markdown, comments, or extra fields."
    )
    user_prompt = (
        f"Generate up to {payload.max_recipes} practical recipes using these ingredients first: {', '.join(ingredients)}. "
        f"Cuisine preference: {payload.cuisine_preference or 'none'}. "
        f"Dietary preference: {payload.dietary_preference or 'none'}. "
        "Keep steps concise and realistic for home cooking."
    )

    request_body: dict[str, Any] = {
        "model": model,
        "temperature": 0.4,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json=request_body,
            )
            response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"LLM provider request failed with status {exc.response.status_code}.",
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="Failed to reach LLM provider.") from exc

    content = response.json().get("choices", [{}])[0].get("message", {}).get("content", "")
    if not content:
        raise HTTPException(status_code=502, detail="LLM provider returned empty content.")

    try:
        parsed = json.loads(_strip_markdown_fences(content))
        validated = AIRecipeResponse(
            recipes=[AIRecipe(**recipe) for recipe in parsed.get("recipes", [])],
            model=model,
        )
    except (json.JSONDecodeError, ValidationError, TypeError) as exc:
        raise HTTPException(status_code=502, detail="LLM output was not valid recipe JSON.") from exc

    if not validated.recipes:
        raise HTTPException(status_code=502, detail="No recipes returned by LLM provider.")

    return validated


async def _refine_detected_ingredients_with_groq(ingredients: list[str]) -> list[str]:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return ingredients

    model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
    system_prompt = (
        "You clean ingredient lists for cooking apps. "
        "Return valid JSON only in this exact schema: {\"ingredients\": string[]}. "
        "Keep only plausible edible ingredients and normalize names (singular, concise)."
    )
    user_prompt = (
        "Clean and normalize this detected ingredient list. "
        "Remove utensils, packaging words, or non-food items. "
        f"List: {', '.join(ingredients)}"
    )

    request_body: dict[str, Any] = {
        "model": model,
        "temperature": 0.1,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json=request_body,
            )
            response.raise_for_status()
    except httpx.HTTPError:
        return ingredients

    content = response.json().get("choices", [{}])[0].get("message", {}).get("content", "")
    if not content:
        return ingredients

    refined = _postprocess_detected_ingredients(_extract_ingredients_list(content))
    return refined or ingredients


async def _detect_ingredients_from_image(file: UploadFile) -> tuple[list[str], str]:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="GROQ_API_KEY is not configured on the backend.",
        )

    content_type = (file.content_type or "").lower()
    allowed_types = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
    if content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Unsupported image type. Please upload JPEG, PNG, or WEBP.",
        )

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded image is empty.")

    max_size_mb = 6
    if len(image_bytes) > max_size_mb * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Image is too large. Max size is {max_size_mb}MB.")

    base64_image = base64.b64encode(image_bytes).decode("utf-8")
    data_url = f"data:{content_type};base64,{base64_image}"

    configured_vision_models = os.getenv("GROQ_VISION_MODELS", "").strip()
    if configured_vision_models:
        vision_models = [item.strip() for item in configured_vision_models.split(",") if item.strip()]
    else:
        preferred_model = os.getenv("GROQ_VISION_MODEL", "").strip()
        vision_models = [
            preferred_model,
            "meta-llama/llama-4-scout-17b-16e-instruct",
            "llama-3.2-90b-vision-preview",
            "llama-3.2-11b-vision-preview",
        ]
        # Keep order while removing empties/duplicates
        unique_models: list[str] = []
        seen_models = set()
        for model_name in vision_models:
            if not model_name:
                continue
            if model_name in seen_models:
                continue
            seen_models.add(model_name)
            unique_models.append(model_name)
        vision_models = unique_models

    system_prompt = (
        "You identify cooking ingredients from a photo. "
        "Return strict JSON only in this exact shape: "
        "{\"ingredients\": [{\"name\": string, \"confidence\": number}]}. "
        "Rules: include only food ingredients, no utensils/containers/background objects, "
        "prefer singular ingredient names (e.g., tomato, onion, garlic), "
        "and use confidence from 0 to 1."
    )

    content = ""
    chosen_model = ""
    provider_errors: list[str] = []

    async with httpx.AsyncClient(timeout=60.0) as client:
        for vision_model in vision_models:
            request_body: dict[str, Any] = {
                "model": vision_model,
                "temperature": 0.2,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": (
                                    "Identify ingredients in this image for recipe generation. "
                                    "If this is a cooked dish, infer likely core ingredients conservatively. "
                                    "Return 5-20 ingredients with confidence in strict JSON only."
                                ),
                            },
                            {
                                "type": "image_url",
                                "image_url": {"url": data_url},
                            },
                        ],
                    },
                ],
            }

            try:
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json=request_body,
                )

                if response.status_code >= 400:
                    error_text = response.text[:300]
                    provider_errors.append(f"{vision_model}: {response.status_code} {error_text}")
                    # Try fallback model for common provider/model validation errors.
                    if response.status_code in {400, 404, 422}:
                        continue
                    raise HTTPException(
                        status_code=502,
                        detail=f"Vision provider error ({response.status_code}).",
                    )

                content = response.json().get("choices", [{}])[0].get("message", {}).get("content", "")
                if content:
                    chosen_model = vision_model
                    break

                provider_errors.append(f"{vision_model}: empty content")
            except httpx.HTTPError as exc:
                provider_errors.append(f"{vision_model}: network error")
                # Continue trying fallback models on request failures.
                continue

    if not content:
        detail = "Vision request failed for all configured models."
        if provider_errors:
            detail = f"{detail} {provider_errors[0]}"
        raise HTTPException(status_code=502, detail=detail)

    detected_ingredients: list[str] = []

    try:
        parsed = json.loads(_strip_markdown_fences(content))
        if isinstance(parsed, dict) and isinstance(parsed.get("ingredients"), list):
            for item in parsed["ingredients"]:
                if isinstance(item, dict):
                    name = str(item.get("name", "")).strip()
                    confidence_raw = item.get("confidence", 0)
                    try:
                        confidence = float(confidence_raw)
                    except (TypeError, ValueError):
                        confidence = 0
                    if name and confidence >= 0.45:
                        detected_ingredients.append(name)
                elif isinstance(item, str):
                    detected_ingredients.append(item.strip())
    except json.JSONDecodeError:
        detected_ingredients = []

    if not detected_ingredients:
        detected_ingredients = _extract_ingredients_list(content)

    detected_ingredients = _postprocess_detected_ingredients(detected_ingredients)
    detected_ingredients = await _refine_detected_ingredients_with_groq(detected_ingredients)

    if not detected_ingredients:
        raise HTTPException(
            status_code=502,
            detail="Could not detect ingredients from image. Try a clearer photo.",
        )

    return detected_ingredients, chosen_model


@app.post("/api/ai/recipes", response_model=AIRecipeResponse)
async def generate_recipes(
    payload: AIRecipeRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate recipe suggestions from a list of ingredients."""
    ingredients = _normalize_ingredients(payload.ingredients)
    if not ingredients:
        raise HTTPException(status_code=400, detail="Please provide at least one ingredient.")
    return await _generate_recipes_with_groq(payload, ingredients)


@app.post("/api/ai/recipes/from-image", response_model=AIImageRecipeResponse)
async def generate_recipes_from_image(
    image: UploadFile = File(...),
    max_recipes: int = Form(default=5),
    cuisine_preference: str | None = Form(default=None),
    dietary_preference: str | None = Form(default=None),
    current_user: User = Depends(get_current_user),
):
    """Detect ingredients from an image, then generate recipes from those ingredients."""
    if max_recipes < 1 or max_recipes > 10:
        raise HTTPException(status_code=400, detail="max_recipes must be between 1 and 10.")

    detected_ingredients, vision_model = await _detect_ingredients_from_image(image)

    recipe_payload = AIRecipeRequest(
        ingredients=detected_ingredients,
        max_recipes=max_recipes,
        cuisine_preference=cuisine_preference,
        dietary_preference=dietary_preference,
    )
    recipe_response = await _generate_recipes_with_groq(recipe_payload, detected_ingredients)

    return AIImageRecipeResponse(
        detected_ingredients=detected_ingredients,
        recipes=recipe_response.recipes,
        vision_model=vision_model,
        recipe_model=recipe_response.model,
    )

if __name__ == "__main__":
    import uvicorn
    print("\n🚀 Starting Recipe Buddy Backend...")
    print("📍 Server: http://localhost:8000")
    print("📚 Docs: http://localhost:8000/docs")
    print("\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)
