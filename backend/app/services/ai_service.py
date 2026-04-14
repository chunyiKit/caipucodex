from __future__ import annotations

import base64
import json
import secrets
import time
from collections import Counter

import httpx
from openai import OpenAI
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import UPLOAD_DIR, get_settings
from app.models import Recipe
from app.schemas.ai import (
    AIRecommendRequest,
    AIRecommendResponse,
    GenerateCoverRequest,
    GenerateCoverResponse,
)


class AIServiceError(RuntimeError):
    pass


class AIService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def recommend(self, db: Session, payload: AIRecommendRequest) -> AIRecommendResponse:
        if not self.settings.openai_api_key:
            raise AIServiceError("AI service is not configured")

        recipes = list(db.scalars(select(Recipe).order_by(Recipe.created_at.desc()).limit(200)).all())
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
        valid_ids = {recipe.id for recipe in recipes}
        category_counts = self._suggested_category_mix(payload.diners)
        prompt = self._build_prompt(payload.preferences, payload.diners, category_counts, recipe_catalog)
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

        # Validate all recipe_ids exist in the database
        invalid_ids = {dish.recipe_id for dish in result.dishes} - valid_ids
        if invalid_ids:
            raise AIServiceError(f"AI returned invalid recipe IDs: {invalid_ids}")

        return result

    def generate_cover(self, payload: GenerateCoverRequest) -> GenerateCoverResponse:
        if not self.settings.ark_api_key:
            raise AIServiceError("Image generation service is not configured (ARK_API_KEY)")

        prompt = self._build_cover_prompt(payload.name, payload.ingredients)

        try:
            response = httpx.post(
                f"{self.settings.ark_base_url}/images/generations",
                headers={
                    "Authorization": f"Bearer {self.settings.ark_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.settings.ark_image_model,
                    "prompt": prompt,
                    "n": 1,
                    "size": "2048x2048",
                    "response_format": "b64_json",
                },
                timeout=60.0,
            )
            response.raise_for_status()
        except httpx.HTTPError as exc:
            raise AIServiceError("Image generation request failed") from exc

        data = response.json()
        items = data.get("data", [])
        if not items:
            raise AIServiceError("AI returned empty image data")

        image_b64 = items[0].get("b64_json", "")
        if image_b64:
            image_bytes = base64.b64decode(image_b64)
        else:
            image_url = items[0].get("url", "")
            if not image_url:
                raise AIServiceError("AI returned empty image data")
            img_resp = httpx.get(image_url, timeout=30.0)
            img_resp.raise_for_status()
            image_bytes = img_resp.content

        filename = f"{int(time.time())}_{secrets.token_hex(4)}.png"
        filepath = UPLOAD_DIR / filename
        filepath.write_bytes(image_bytes)

        return GenerateCoverResponse(url=f"/uploads/recipes/{filename}")

    def _build_cover_prompt(self, name: str, ingredients: list[str]) -> str:
        ingredient_text = "、".join(ingredients) if ingredients else "各种新鲜食材"
        return (
            f"漫画动画风格菜谱菜品图，Q版卡通化呈现。\n"
            f"菜品名称：{name}\n"
            f"参考食材（仅用于理解菜品外观）：{ingredient_text}\n"
            f"要求：只画这道菜的成品主菜，不要出现调料（酱油、盐、醋等）和配菜，"
            f"色彩鲜艳饱满，食物造型萌趣可爱，干净简洁的浅色背景，"
            f"俯视角度拍摄风格，适合作为手机菜谱应用的封面图，高清精致"
        )

    def _suggested_category_mix(self, diners: int) -> dict[str, int]:
        if diners <= 2:
            return {"荤菜": 1, "素菜": 1, "汤类": 1, "主食": 1}
        if diners <= 4:
            return {"荤菜": 2, "素菜": 2, "汤类": 1, "主食": 1}
        if diners <= 6:
            return {"荤菜": 2, "素菜": 2, "汤类": 1, "主食": 1, "凉菜": 1}
        # 7+
        return {"荤菜": 3, "素菜": 3, "汤类": 1, "主食": 2, "凉菜": 1}

    def _build_prompt(
        self,
        preferences: list[str],
        diners: int,
        category_counts: dict[str, int],
        recipe_catalog: list[dict],
    ) -> str:
        total_dishes = sum(category_counts.values())
        valid_ids = [r["id"] for r in recipe_catalog]
        return (
            "你是家庭聚餐配菜助手。请严格返回 JSON，不要输出任何额外说明文字。\n\n"
            f"用餐人数: {diners} 人\n"
            f"偏好: {', '.join(preferences) if preferences else '无'}\n"
            f"建议分类及数量: {json.dumps(category_counts, ensure_ascii=False)}（共 {total_dishes} 道菜）\n\n"
            "【严格要求】\n"
            f"1. 你只能从下方「可选菜品列表」中选择菜品，recipe_id 必须是列表中存在的 id，"
            f"合法 id 范围: {valid_ids}。禁止编造不存在的 id，禁止返回 null。\n"
            "2. 必须至少包含一道汤类。\n"
            "3. 尽量荤素均衡，根据用餐人数合理搭配分量。\n"
            "4. name 和 category 必须与列表中对应 id 的菜品完全一致。\n\n"
            "返回格式（纯 JSON，无 markdown）:\n"
            '{\"dishes\": [{\"recipe_id\": number, \"name\": string, \"category\": string, \"reason\": string}]}\n\n'
            f"可选菜品列表:\n{json.dumps(recipe_catalog, ensure_ascii=False)}"
        )
