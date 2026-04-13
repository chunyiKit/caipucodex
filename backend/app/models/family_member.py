from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class FamilyMember(Base):
    __tablename__ = "family_members"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    height_cm: Mapped[int | None] = mapped_column(Integer())
    signature: Mapped[str | None] = mapped_column(String(200))
    body_report: Mapped[dict | None] = mapped_column(JSON())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), server_default=func.now(), onupdate=func.now(), nullable=False
    )
