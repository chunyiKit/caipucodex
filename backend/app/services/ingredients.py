from __future__ import annotations

import re
from collections import defaultdict
from decimal import Decimal, InvalidOperation

from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select

from app.constants import INGREDIENT_GROUPS
from app.models import Ingredient, Menu, MenuItem, MenuIngredientPurchase, Recipe
from app.schemas.menu import IngredientGroup, IngredientEntry, IngredientsResponse

INGREDIENT_CATEGORY_RULES = {
    "蔬菜类": ["菜", "椒", "葱", "蒜", "姜", "瓜", "豆", "萝卜", "西兰花", "茄", "菌", "菇", "番茄", "土豆"],
    "肉类": ["肉", "鸡", "鸭", "鱼", "虾", "排骨", "牛", "羊", "蛋", "肠", "丸"],
    "调味料": ["盐", "糖", "酱", "醋", "油", "料酒", "淀粉", "胡椒", "辣椒", "香料", "蚝油", "生抽", "老抽"],
    "主食": ["米", "面", "粉", "饭", "馒头", "饼", "年糕", "面条"],
}
AMOUNT_RE = re.compile(r"^\s*(\d+(?:\.\d+)?)\s*([\u4e00-\u9fa5a-zA-Z]+)\s*$")


def classify_ingredient(name: str) -> str:
    for group, keywords in INGREDIENT_CATEGORY_RULES.items():
        if any(keyword in name for keyword in keywords):
            return group
    return "其他"


def merge_amounts(existing: str | None, incoming: str | None) -> str | None:
    if not existing:
        return incoming
    if not incoming:
        return existing
    left = AMOUNT_RE.match(existing)
    right = AMOUNT_RE.match(incoming)
    if left and right and left.group(2) == right.group(2):
        try:
            total = Decimal(left.group(1)) + Decimal(right.group(1))
        except InvalidOperation:
            return f"{existing} + {incoming}"
        total_str = str(int(total)) if total == total.to_integral() else str(total.normalize())
        return f"{total_str}{left.group(2)}"
    if incoming == existing:
        return existing
    return f"{existing} + {incoming}"


def build_ingredients_response(db: Session, menu_id: int) -> IngredientsResponse | None:
    stmt = (
        select(Menu)
        .where(Menu.id == menu_id)
        .options(selectinload(Menu.items))
    )
    menu = db.scalar(stmt)
    if not menu:
        return None

    recipe_ids = [item.recipe_id for item in menu.items if item.recipe_id]
    recipes = {}
    if recipe_ids:
        recipe_stmt = (
            select(Recipe)
            .where(Recipe.id.in_(recipe_ids))
            .options(selectinload(Recipe.ingredients))
        )
        for recipe in db.scalars(recipe_stmt).all():
            recipes[recipe.id] = recipe

    grouped: dict[str, dict[str, str | None]] = {group: {} for group in INGREDIENT_GROUPS}
    for item in menu.items:
        recipe = recipes.get(item.recipe_id) if item.recipe_id else None
        if not recipe:
            continue
        for ingredient in recipe.ingredients:
            category = classify_ingredient(ingredient.name)
            existing_amount = grouped[category].get(ingredient.name)
            grouped[category][ingredient.name] = merge_amounts(existing_amount, ingredient.amount)

    # Load purchased states
    purchase_stmt = select(MenuIngredientPurchase.ingredient_key).where(
        MenuIngredientPurchase.menu_id == menu_id
    )
    purchased_keys = set(db.scalars(purchase_stmt).all())

    groups = []
    total_count = 0
    for group_name in INGREDIENT_GROUPS:
        items = [
            IngredientEntry(
                name=name,
                amount=amount,
                purchased=f"{group_name}-{name}" in purchased_keys,
            )
            for name, amount in grouped[group_name].items()
        ]
        if not items:
            continue
        items.sort(key=lambda item: item.name)
        total_count += len(items)
        groups.append(IngredientGroup(category=group_name, items=items))
    return IngredientsResponse(menu_id=menu_id, total_count=total_count, groups=groups)
