from typing import cast

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.dependencies import get_current_user
from app.models import User
from app.schemas.ai import AIImageRecipeResponse, AIRecipeRequest, AIRecipeResponse
from app.services.ai_service import (
    detect_ingredients_from_image,
    generate_recipes_with_groq,
    normalize_ingredients,
)

router = APIRouter(prefix="/api/ai", tags=["ai"])


def _resolve_preference(request_value: str | None, profile_value: object) -> str | None:
    """Use the request value when explicitly provided; otherwise fall back to the user's saved profile preference."""
    if request_value is not None and request_value.strip():
        return request_value
    saved = cast(str | None, profile_value)
    if saved and saved.strip():
        return saved
    return None


@router.post("/recipes", response_model=AIRecipeResponse)
async def generate_recipes(
    payload: AIRecipeRequest,
    current_user: User = Depends(get_current_user),
):
    ingredients = normalize_ingredients(payload.ingredients)
    if not ingredients:
        raise HTTPException(status_code=400, detail="Please provide at least one ingredient.")

    payload.cuisine_preference = _resolve_preference(
        payload.cuisine_preference, current_user.cuisine_preference
    )
    payload.dietary_preference = _resolve_preference(
        payload.dietary_preference, current_user.dietary_preference
    )

    return await generate_recipes_with_groq(payload, ingredients)


@router.post("/recipes/from-image", response_model=AIImageRecipeResponse)
async def generate_recipes_from_image(
    image: UploadFile = File(...),
    max_recipes: int = Form(default=5),
    cuisine_preference: str | None = Form(default=None),
    dietary_preference: str | None = Form(default=None),
    current_user: User = Depends(get_current_user),
):
    if max_recipes < 1 or max_recipes > 10:
        raise HTTPException(status_code=400, detail="max_recipes must be between 1 and 10.")

    detected_ingredients, vision_model = await detect_ingredients_from_image(image)

    recipe_payload = AIRecipeRequest(
        ingredients=detected_ingredients,
        max_recipes=max_recipes,
        cuisine_preference=_resolve_preference(cuisine_preference, current_user.cuisine_preference),
        dietary_preference=_resolve_preference(dietary_preference, current_user.dietary_preference),
    )
    recipe_response = await generate_recipes_with_groq(recipe_payload, detected_ingredients)

    return AIImageRecipeResponse(
        detected_ingredients=detected_ingredients,
        recipes=recipe_response.recipes,
        vision_model=vision_model,
        recipe_model=recipe_response.model,
    )
