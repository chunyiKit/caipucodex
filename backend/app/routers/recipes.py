from __future__ import annotations

import secrets
import time
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.config import UPLOAD_DIR
from app.constants import REAL_CATEGORIES
from app.database import get_db
from app.models import CookingStep, Ingredient, Recipe
from app.repositories.recipes import count_recipes, get_recipe, list_recipes
from app.schemas.recipe import RecipeCard, RecipeDetail, RecipeListResponse, RecipeWrite

router = APIRouter(prefix="/api/recipes", tags=["recipes"])


@router.get("", response_model=RecipeListResponse)
def get_recipes(
    category: str | None = Query(default=None),
    search: str | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> dict:
    items = list_recipes(db, category=category, search=search, skip=skip, limit=limit)
    total = count_recipes(db, category=category, search=search)
    return {"items": items, "total": total}


@router.get("/{recipe_id}", response_model=RecipeDetail)
def get_recipe_detail(recipe_id: int, db: Session = Depends(get_db)) -> Recipe:
    recipe = get_recipe(db, recipe_id)
    if not recipe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")
    return recipe


@router.post("", response_model=RecipeDetail, status_code=status.HTTP_201_CREATED)
def create_recipe(payload: RecipeWrite, db: Session = Depends(get_db)) -> Recipe:
    recipe = Recipe(
        name=payload.name,
        category=payload.category,
        description=payload.description,
        cooking_time=payload.cooking_time,
        difficulty=payload.difficulty,
        image_url=payload.image_url,
    )
    for index, ingredient in enumerate(payload.ingredients):
        recipe.ingredients.append(
            Ingredient(name=ingredient.name, amount=ingredient.amount, sort_order=ingredient.sort_order or index)
        )
    for index, step in enumerate(payload.cooking_steps):
        recipe.cooking_steps.append(
            CookingStep(
                step_number=index + 1,
                description=step.description,
                image_url=step.image_url,
                sort_order=step.sort_order or index,
            )
        )
    db.add(recipe)
    db.commit()
    db.refresh(recipe)
    return get_recipe(db, recipe.id)


@router.put("/{recipe_id}", response_model=RecipeDetail)
def update_recipe(recipe_id: int, payload: RecipeWrite, db: Session = Depends(get_db)) -> Recipe:
    recipe = get_recipe(db, recipe_id)
    if not recipe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

    recipe.name = payload.name
    recipe.category = payload.category
    recipe.description = payload.description
    recipe.cooking_time = payload.cooking_time
    recipe.difficulty = payload.difficulty
    recipe.image_url = payload.image_url

    recipe.ingredients.clear()
    recipe.cooking_steps.clear()
    for index, ingredient in enumerate(payload.ingredients):
        recipe.ingredients.append(
            Ingredient(name=ingredient.name, amount=ingredient.amount, sort_order=ingredient.sort_order or index)
        )
    for index, step in enumerate(payload.cooking_steps):
        recipe.cooking_steps.append(
            CookingStep(
                step_number=index + 1,
                description=step.description,
                image_url=step.image_url,
                sort_order=step.sort_order or index,
            )
        )
    db.add(recipe)
    db.commit()
    return get_recipe(db, recipe_id)


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_recipe(recipe_id: int, db: Session = Depends(get_db)) -> Response:
    recipe = get_recipe(db, recipe_id)
    if not recipe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")
    db.delete(recipe)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/upload-image", status_code=status.HTTP_201_CREATED)
async def upload_recipe_image(file: UploadFile = File(...)) -> dict[str, str]:
    allowed_types = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/svg+xml": ".svg"}
    ext = allowed_types.get(file.content_type or "")
    if not ext:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported image type")

    filename = f"{int(time.time())}_{secrets.token_hex(6)}{ext}"
    destination = UPLOAD_DIR / filename
    content = await file.read()
    if len(content) > 2 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Image too large")
    destination.write_bytes(content)
    return {"url": f"/uploads/recipes/{filename}"}
