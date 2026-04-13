from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.ai import (
    AIRecommendRequest,
    AIRecommendResponse,
    GenerateCoverRequest,
    GenerateCoverResponse,
)
from app.services.ai_service import AIService, AIServiceError

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/recommend", response_model=AIRecommendResponse)
def recommend(payload: AIRecommendRequest, db: Session = Depends(get_db)) -> AIRecommendResponse:
    try:
        return AIService().recommend(db, payload)
    except AIServiceError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


@router.post("/generate-cover", response_model=GenerateCoverResponse)
def generate_cover(payload: GenerateCoverRequest) -> GenerateCoverResponse:
    try:
        return AIService().generate_cover(payload)
    except AIServiceError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
