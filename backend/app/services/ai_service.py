from __future__ import annotations

import json
from collections import Counter

from openai import OpenAI
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Recipe
from app.schemas.ai import AIRecommendRequest, AIRecommendResponse


class AIServiceError(RuntimeError):
    pass


class AIService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def recommend(self, db: Session, payload: AIRecommendRequest) -> AIRecommendResponse:
        if not self.settings.openai_api_key:
            raise AIServiceError("AI service is not configured")

        recipes = list(db.scalars(select(Recipe).order_by(Recipe.created_at.desc()).limit(50)).all())
        recipe_catalog = [
            {
                "id": recipe.id,
                "name": recipe.name,
                "category": recipe.category,
                "description": recipe.description,
                "cooking_time": recipe.cooking_time,
            }
            for recipe in recipes
        ]
        category_counts = self._suggested_category_mix(payload.people_count)
        prompt = self._build_prompt(payload.people_count, payload.preferences, category_counts, recipe_catalog)
        client = OpenAI(
            api_key=self.settings.openai_api_key,
            base_url=self.settings.openai_base_url,
            timeout=self.settings.openai_timeout_seconds,
        )
        try:
            response = client.responses.create(
                model=self.settings.openai_model,
                input=prompt,
                temperature=0.7,
            )
        except Exception as exc:  # pragma: no cover
            raise AIServiceError("AI request failed") from exc

        raw_text = getattr(response, "output_text", "")
        if not raw_text:
            raise AIServiceError("AI returned empty response")

        try:
            data = json.loads(raw_text)
            result = AIRecommendResponse.model_validate(data)
        except (json.JSONDecodeError, ValidationError) as exc:
            raise AIServiceError("AI returned invalid JSON") from exc

        if not any(dish.category == "汤类" for dish in result.dishes):
            raise AIServiceError("AI response missing soup dish")
        return result

    def _suggested_category_mix(self, people_count: int) -> dict[str, int]:
        if people_count <= 3:
            return {"荤菜": 1, "素菜": 2, "汤类": 1}
        if people_count <= 6:
            return {"荤菜": 2, "素菜": 3, "汤类": 1, "主食": 1}
        return {"荤菜": 3, "素菜": 4, "汤类": 1, "主食": 1}

    def _build_prompt(
        self,
        people_count: int,
        preferences: list[str],
        category_counts: dict[str, int],
        recipe_catalog: list[dict],
    ) -> str:
        return (
            "你是家庭聚餐配菜助手。请严格返回 JSON，不要输出额外说明。\n"
            f"人数: {people_count}\n"
            f"偏好: {', '.join(preferences) if preferences else '无'}\n"
            f"建议分类数量: {json.dumps(category_counts, ensure_ascii=False)}\n"
            "要求: 必须至少包含一个汤类；尽量荤素均衡；优先使用提供的数据库菜谱；"
            "若数据库中没有合适菜，recipe_id 设为 null。\n"
            "返回格式: {\"people_count\": number, \"dishes\": [{\"recipe_id\": number|null, \"name\": string, \"category\": string, \"reason\": string}]}\n"
            f"数据库菜谱: {json.dumps(recipe_catalog, ensure_ascii=False)}"
        )
