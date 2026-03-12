from fastapi import APIRouter

from app.constants import CATEGORIES

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("")
def list_categories() -> list[str]:
    return CATEGORIES
