from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.models import Recipe


def list_recipes(db: Session, category: str | None = None, search: str | None = None) -> list[Recipe]:
    stmt = select(Recipe).order_by(Recipe.created_at.desc())
    if category and category != "全部":
        stmt = stmt.where(Recipe.category == category)
    if search:
        pattern = f"%{search.strip()}%"
        stmt = stmt.where(or_(Recipe.name.ilike(pattern), Recipe.description.ilike(pattern)))
    return list(db.scalars(stmt).all())


def get_recipe(db: Session, recipe_id: int) -> Recipe | None:
    stmt = (
        select(Recipe)
        .where(Recipe.id == recipe_id)
        .options(selectinload(Recipe.ingredients), selectinload(Recipe.cooking_steps))
    )
    return db.scalar(stmt)
