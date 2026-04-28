from pydantic import BaseModel, Field


class AIRecipeIngredient(BaseModel):
    id: int
    name: str
    amount: float = 1.0
    unit: str = "unit"


class AIRecipeTime(BaseModel):
    hours: int = 0
    minutes: int = 0


class AIRecipeStep(BaseModel):
    id: int
    description: str
    time: AIRecipeTime | None = None


class AIRecipeRequest(BaseModel):
    ingredients: list[str] | str
    max_recipes: int = Field(default=5, ge=1, le=10)
    cuisine_preference: str | None = None
    dietary_preference: str | None = None


# Mirrors the front-end `Recipe` shape (minus the server-assigned `id`) so the
# AI response can be consumed wherever a Recipe is expected.
class AIRecipe(BaseModel):
    name: str
    description: str
    imgUrl: str | None = None
    rating: int = 0
    inPlan: bool = False
    ingredients: list[AIRecipeIngredient] = Field(default_factory=list)
    steps: list[AIRecipeStep] = Field(default_factory=list)


class AIRecipeResponse(BaseModel):
    recipes: list[AIRecipe]
    model: str


class AIImageRecipeResponse(BaseModel):
    detected_ingredients: list[str]
    recipes: list[AIRecipe]
    vision_model: str
    recipe_model: str
