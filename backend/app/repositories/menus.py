from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import Menu


def list_menus(db: Session) -> list[Menu]:
    stmt = select(Menu).options(selectinload(Menu.items)).order_by(Menu.menu_date.desc(), Menu.created_at.desc())
    return list(db.scalars(stmt).all())


def get_menu(db: Session, menu_id: int) -> Menu | None:
    stmt = select(Menu).where(Menu.id == menu_id).options(selectinload(Menu.items))
    return db.scalar(stmt)
