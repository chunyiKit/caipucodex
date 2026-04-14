from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models import Recipe


def _recipe_filter(category: str | None = None, search: str | None = None):
    """Build common filter conditions."""
    conditions = []
    if category and category != "全部":
        conditions.append(Recipe.category == category)
    if search:
        pattern = f"%{search.strip()}%"
        conditions.append(or_(Recipe.name.ilike(pattern), Recipe.description.ilike(pattern)))
    return conditions


def list_recipes(
    db: Session,
    category: str | None = None,
    search: str | None = None,
    skip: int = 0,
    limit: int | None = None,
) -> list[Recipe]:
    stmt = select(Recipe).order_by(Recipe.created_at.desc())
    for cond in _recipe_filter(category, search):
        stmt = stmt.where(cond)
    if skip:
        stmt = stmt.offset(skip)
    if limit is not None:
        stmt = stmt.limit(limit)
    return list(db.scalars(stmt).all())


def count_recipes(db: Session, category: str | None = None, search: str | None = None) -> int:
    stmt = select(func.count(Recipe.id))
    for cond in _recipe_filter(category, search):
        stmt = stmt.where(cond)
    return db.scalar(stmt) or 0


def get_recipe(db: Session, recipe_id: int) -> Recipe | None:
    stmt = (
        select(Recipe)
        .where(Recipe.id == recipe_id)
        .options(selectinload(Recipe.ingredients), selectinload(Recipe.cooking_steps))
    )
    return db.scalar(stmt)
