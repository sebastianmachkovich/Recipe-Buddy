from pydantic import BaseModel, Field


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
    inPlan: bool = False
    ingredients: list[RecipeIngredientPayload] = Field(default_factory=list)
    steps: list[RecipeStepPayload] = Field(default_factory=list)
