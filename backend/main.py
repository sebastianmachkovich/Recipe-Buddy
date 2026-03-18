"""Recipe Buddy FastAPI Application - Minimal Setup."""


from fastapi import FastAPI
from fastapi import File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
import base64
import json
import os
import re
from typing import Any

import httpx
from pydantic import BaseModel, Field, ValidationError
from app.database import *
from app.models import Recipe
db = next(get_db())

#Create tables if they don't exist
Recipe.metadata.create_all(bind=engine)

#Test Recipes
"""
soup_recipe = Recipe(
    name="Squash and Lentil Soup",
    description="A hearty soup made with lentils, vegetables, and spices.",
    image_url="https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&h=300&fit=crop",
    rating=0,
    ingredients=json.dumps([
        {"id": 1, "name": "Lentils", "amount": 1, "unit": "unit"},
        {"id": 2, "name": "Onions", "amount": 1, "unit": "unit"},
        {"id": 3, "name": "Carrots", "amount": 1, "unit": "unit"},
        {"id": 4, "name": "Potatoes", "amount": 1, "unit": "unit"},
        {"id": 5, "name": "Garlic", "amount": 1, "unit": "unit"},
        {"id": 6, "name": "Ginger", "amount": 1, "unit": "unit"},
        {"id": 7, "name": "Chili Peppers", "amount": 1, "unit": "unit"},
    ]),
    steps=json.dumps([
        "Step 1: Prep vegetables",
        "Step 2: Cook lentils",
        "Step 3: Combine and simmer"
    ])
)

# add and commit
db.add(soup_recipe)
db.commit()

# close session
db.close()

print("Recipe added successfully!")
"""
recipe = db.query(Recipe).first()

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
        "testdata": recipe.name if recipe else "No recipes found"
    }

@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "database": "ready"}

@app.get("/api/test")
def test_endpoint():
    """Test endpoint to verify API is working."""
    return {"message": "API is working! Start building your features here."}


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
async def generate_recipes(payload: AIRecipeRequest):
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
