from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.constants import CATEGORIES
from app.database import get_db
from app.models import Recipe

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("")
def list_categories(db: Session = Depends(get_db)) -> list[str]:
    rows = db.execute(select(func.distinct(Recipe.category))).scalars().all()
    db_categories = set(rows)
    extra = sorted(db_categories - set(CATEGORIES))
    return CATEGORIES + extra
