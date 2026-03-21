from pydantic import BaseModel, Field


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
