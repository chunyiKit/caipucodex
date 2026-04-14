from pydantic import BaseModel, Field, field_validator

from app.constants import REAL_CATEGORIES


class AIRecommendRequest(BaseModel):
    preferences: list[str] = Field(default_factory=list)
    diners: int = Field(default=2, ge=1, le=20)


class AIRecommendedDish(BaseModel):
    recipe_id: int
    name: str = Field(min_length=1, max_length=100)
    category: str
    reason: str = Field(min_length=1, max_length=200)

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str) -> str:
        if value not in REAL_CATEGORIES:
            raise ValueError("invalid category")
        return value


class AIRecommendResponse(BaseModel):
    dishes: list[AIRecommendedDish]


class GenerateCoverRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    ingredients: list[str] = Field(default_factory=list)


class GenerateCoverResponse(BaseModel):
    url: str
