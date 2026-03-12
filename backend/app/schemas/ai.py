from pydantic import BaseModel, Field, field_validator

from app.constants import REAL_CATEGORIES


class AIRecommendRequest(BaseModel):
    people_count: int = Field(ge=1, le=20)
    preferences: list[str] = Field(default_factory=list)


class AIRecommendedDish(BaseModel):
    recipe_id: int | None = None
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
    people_count: int
    dishes: list[AIRecommendedDish]
