from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Menu, MenuItem
from app.repositories.menus import get_menu, list_menus
from app.schemas.menu import IngredientsResponse, MenuDetail, MenuSummary, MenuWrite
from app.services.ingredients import build_ingredients_response

router = APIRouter(prefix="/api/menus", tags=["menus"])


@router.get("", response_model=list[MenuSummary])
def get_menus(db: Session = Depends(get_db)) -> list[Menu]:
    return list_menus(db)


@router.get("/{menu_id}", response_model=MenuDetail)
def get_menu_detail(menu_id: int, db: Session = Depends(get_db)) -> Menu:
    menu = get_menu(db, menu_id)
    if not menu:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu not found")
    return menu


@router.post("", response_model=MenuDetail, status_code=status.HTTP_201_CREATED)
def create_menu(payload: MenuWrite, db: Session = Depends(get_db)) -> Menu:
    menu = Menu(
        title=payload.title,
        menu_date=payload.menu_date,
        is_ai_generated=payload.is_ai_generated,
        ai_preferences=payload.ai_preferences,
    )
    for index, item in enumerate(payload.items):
        menu.items.append(
            MenuItem(
                recipe_id=item.recipe_id,
                recipe_name=item.recipe_name,
                recipe_category=item.recipe_category,
                image_url=item.image_url,
                cooking_time=item.cooking_time,
                quantity=item.quantity,
                ai_reason=item.ai_reason,
                sort_order=item.sort_order or index,
            )
        )
    db.add(menu)
    db.commit()
    db.refresh(menu)
    return get_menu(db, menu.id)


@router.delete("/{menu_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_menu(menu_id: int, db: Session = Depends(get_db)) -> Response:
    menu = get_menu(db, menu_id)
    if not menu:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu not found")
    db.delete(menu)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{menu_id}/ingredients", response_model=IngredientsResponse)
def get_menu_ingredients(menu_id: int, db: Session = Depends(get_db)) -> IngredientsResponse:
    result = build_ingredients_response(db, menu_id)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu not found")
    return result
