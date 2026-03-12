from datetime import date, datetime

from pydantic import BaseModel, Field

from app.constants import REAL_CATEGORIES
from .common import ORMModel


class MenuItemWrite(BaseModel):
    recipe_id: int | None = None
    recipe_name: str = Field(min_length=1, max_length=100)
    recipe_category: str
    image_url: str | None = Field(default=None, max_length=500)
    cooking_time: int | None = Field(default=None, ge=1, le=600)
    quantity: int = Field(default=1, ge=1, le=99)
    ai_reason: str | None = Field(default=None, max_length=200)
    sort_order: int = 0

    @property
    def normalized_category(self) -> str:
        return self.recipe_category


class MenuWrite(BaseModel):
    title: str | None = Field(default=None, max_length=100)
    menu_date: date
    people_count: int = Field(default=3, ge=1, le=20)
    is_ai_generated: bool = False
    ai_preferences: dict | None = None
    items: list[MenuItemWrite] = Field(min_length=1)


class MenuItemRead(ORMModel):
    id: int
    recipe_id: int | None
    recipe_name: str
    recipe_category: str
    image_url: str | None
    cooking_time: int | None
    quantity: int
    ai_reason: str | None
    sort_order: int


class MenuSummary(ORMModel):
    id: int
    title: str | None
    menu_date: date
    people_count: int
    is_ai_generated: bool
    created_at: datetime
    items: list[MenuItemRead]


class MenuDetail(MenuSummary):
    ai_preferences: dict | None


class IngredientEntry(BaseModel):
    name: str
    amount: str | None = None
    purchased: bool = False


class IngredientGroup(BaseModel):
    category: str
    items: list[IngredientEntry]


class IngredientsResponse(BaseModel):
    menu_id: int
    total_count: int
    groups: list[IngredientGroup]
