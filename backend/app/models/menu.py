from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import JSON, Boolean, Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Menu(Base):
    __tablename__ = "menus"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str | None] = mapped_column(String(100))
    menu_date: Mapped[date] = mapped_column(Date(), nullable=False, server_default=func.current_date())
    people_count: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    is_ai_generated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    ai_preferences: Mapped[dict | None] = mapped_column(JSON())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), server_default=func.now(), nullable=False)

    items: Mapped[list[MenuItem]] = relationship(
        back_populates="menu", cascade="all, delete-orphan", order_by="MenuItem.sort_order"
    )


class MenuItem(Base):
    __tablename__ = "menu_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    menu_id: Mapped[int] = mapped_column(ForeignKey("menus.id", ondelete="CASCADE"), index=True)
    recipe_id: Mapped[int | None] = mapped_column(ForeignKey("recipes.id", ondelete="SET NULL"), nullable=True, index=True)
    recipe_name: Mapped[str] = mapped_column(String(100), nullable=False)
    recipe_category: Mapped[str] = mapped_column(String(20), nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500))
    cooking_time: Mapped[int | None] = mapped_column(Integer())
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    ai_reason: Mapped[str | None] = mapped_column(String(200))
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    menu: Mapped[Menu] = relationship(back_populates="items")
