from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import FamilyMember


def list_family_members(db: Session) -> list[FamilyMember]:
    stmt = select(FamilyMember).order_by(FamilyMember.updated_at.desc(), FamilyMember.created_at.desc())
    return list(db.scalars(stmt).all())


def get_family_member(db: Session, member_id: int) -> FamilyMember | None:
    stmt = select(FamilyMember).where(FamilyMember.id == member_id)
    return db.scalar(stmt)
