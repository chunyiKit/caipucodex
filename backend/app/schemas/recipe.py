from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.constants import REAL_CATEGORIES
from .common import ORMModel


class IngredientBase(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    amount: str | None = Field(default=None, max_length=50)
    sort_order: int = 0


class IngredientRead(IngredientBase, ORMModel):
    id: int


class CookingStepBase(BaseModel):
    description: str = Field(min_length=1)
    image_url: str | None = Field(default=None, max_length=500)
    sort_order: int = 0


class CookingStepRead(CookingStepBase, ORMModel):
    id: int
    step_number: int


class RecipeWrite(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    category: str
    description: str | None = None
    cooking_time: int | None = Field(default=None, ge=1, le=600)
    difficulty: str = Field(default="中等", pattern="^(简单|中等|困难)$")
    image_url: str | None = Field(default=None, max_length=500)
    ingredients: list[IngredientBase] = Field(default_factory=list)
    cooking_steps: list[CookingStepBase] = Field(default_factory=list)

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str) -> str:
        if value not in REAL_CATEGORIES:
            raise ValueError("invalid category")
        return value


class RecipeCard(ORMModel):
    id: int
    name: str
    category: str
    description: str | None
    cooking_time: int | None
    difficulty: str
    image_url: str | None
    created_at: datetime
    updated_at: datetime


class RecipeDetail(RecipeCard):
    ingredients: list[IngredientRead]
    cooking_steps: list[CookingStepRead]
