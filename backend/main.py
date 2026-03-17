"""Recipe Buddy FastAPI Application - Minimal Setup."""


from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
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
        "http://127.0.0.1:5173"
    ],
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


@app.post("/api/ai/recipes", response_model=AIRecipeResponse)
async def generate_recipes(payload: AIRecipeRequest):
    """Generate recipe suggestions from a list of ingredients."""
    ingredients = _normalize_ingredients(payload.ingredients)
    if not ingredients:
        raise HTTPException(status_code=400, detail="Please provide at least one ingredient.")
    return await _generate_recipes_with_groq(payload, ingredients)

if __name__ == "__main__":
    import uvicorn
    print("\n🚀 Starting Recipe Buddy Backend...")
    print("📍 Server: http://localhost:8000")
    print("📚 Docs: http://localhost:8000/docs")
    print("\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)
