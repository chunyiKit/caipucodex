from __future__ import annotations

import secrets
import time

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.config import BASE_DIR
from app.database import get_db
from app.models import FamilyMember
from app.repositories.family_members import get_family_member, list_family_members
from app.schemas.family_member import FamilyMemberRead, FamilyMemberWrite
from app.services.ai_service import AIService, AIServiceError

router = APIRouter(prefix="/api/family-members", tags=["family-members"])

MEMBER_UPLOAD_DIR = BASE_DIR / "uploads" / "family-members"
MEMBER_UPLOAD_PREFIX = "/uploads/family-members/"
BODY_REPORT_UPLOAD_DIR = BASE_DIR / "uploads" / "family-member-body-reports"
BODY_REPORT_UPLOAD_PREFIX = "/uploads/family-member-body-reports/"


def remove_local_upload(file_url: str | None, prefix: str) -> None:
    if not file_url or not file_url.startswith(prefix):
        return
    path = BASE_DIR / file_url.removeprefix("/")
    if path.exists():
        path.unlink()


def remove_local_avatar(avatar_url: str | None) -> None:
    remove_local_upload(avatar_url, MEMBER_UPLOAD_PREFIX)


@router.get("", response_model=list[FamilyMemberRead])
def get_family_member_list(db: Session = Depends(get_db)) -> list[FamilyMember]:
    return list_family_members(db)


@router.get("/{member_id}", response_model=FamilyMemberRead)
def get_family_member_detail(member_id: int, db: Session = Depends(get_db)) -> FamilyMember:
    member = get_family_member(db, member_id)
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family member not found")
    return member


@router.post("", response_model=FamilyMemberRead, status_code=status.HTTP_201_CREATED)
def create_family_member(payload: FamilyMemberWrite, db: Session = Depends(get_db)) -> FamilyMember:
    member = FamilyMember(
        name=payload.name,
        avatar_url=payload.avatar_url,
        height_cm=payload.height_cm,
        signature=payload.signature,
        body_report=payload.body_report.model_dump(mode="json") if payload.body_report else None,
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


@router.put("/{member_id}", response_model=FamilyMemberRead)
def update_family_member(member_id: int, payload: FamilyMemberWrite, db: Session = Depends(get_db)) -> FamilyMember:
    member = get_family_member(db, member_id)
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family member not found")

    previous_avatar = member.avatar_url
    member.name = payload.name
    member.avatar_url = payload.avatar_url
    member.height_cm = payload.height_cm
    member.signature = payload.signature
    if payload.body_report is not None:
        next_body_report = payload.body_report.model_dump(mode="json")
        current_body_report = member.body_report or {}
        if not next_body_report.get("source_image_url") and current_body_report.get("source_image_url"):
            next_body_report["source_image_url"] = current_body_report["source_image_url"]
        member.body_report = next_body_report

    db.add(member)
    db.commit()
    db.refresh(member)

    if previous_avatar != member.avatar_url:
        remove_local_avatar(previous_avatar)

    return member


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_family_member(member_id: int, db: Session = Depends(get_db)) -> Response:
    member = get_family_member(db, member_id)
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family member not found")

    avatar_url = member.avatar_url
    body_report_image_url = (member.body_report or {}).get("source_image_url")
    db.delete(member)
    db.commit()
    remove_local_avatar(avatar_url)
    remove_local_upload(body_report_image_url, BODY_REPORT_UPLOAD_PREFIX)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/upload-avatar", status_code=status.HTTP_201_CREATED)
async def upload_avatar(file: UploadFile = File(...)) -> dict[str, str]:
    allowed_types = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/svg+xml": ".svg"}
    ext = allowed_types.get(file.content_type or "")
    if not ext:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported image type")

    content = await file.read()
    if len(content) > 2 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Image too large")

    MEMBER_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{int(time.time())}_{secrets.token_hex(6)}{ext}"
    destination = MEMBER_UPLOAD_DIR / filename
    destination.write_bytes(content)
    return {"url": f"{MEMBER_UPLOAD_PREFIX}{filename}"}


@router.post("/{member_id}/body-report/ocr", response_model=FamilyMemberRead)
async def ocr_family_member_body_report(
    member_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> FamilyMember:
    member = get_family_member(db, member_id)
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family member not found")

    allowed_types = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
    ext = allowed_types.get(file.content_type or "")
    if not ext:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported image type")

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Image too large")

    try:
        report = AIService().extract_family_member_body_report(content, file.content_type or "image/png")
    except AIServiceError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    BODY_REPORT_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{int(time.time())}_{secrets.token_hex(6)}{ext}"
    destination = BODY_REPORT_UPLOAD_DIR / filename
    destination.write_bytes(content)
    report_url = f"{BODY_REPORT_UPLOAD_PREFIX}{filename}"

    previous_image_url = (member.body_report or {}).get("source_image_url")
    member.body_report = report.model_copy(update={"source_image_url": report_url}).model_dump(mode="json")

    db.add(member)
    db.commit()
    db.refresh(member)

    if previous_image_url != report_url:
        remove_local_upload(previous_image_url, BODY_REPORT_UPLOAD_PREFIX)

    return member
