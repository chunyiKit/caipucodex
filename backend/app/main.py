from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import BASE_DIR, UPLOAD_DIR, get_settings
from app.database import Base, engine
from app.routers.ai import router as ai_router
from app.routers.categories import router as categories_router
from app.routers.health import router as health_router
from app.routers.menus import router as menus_router
from app.routers.recipes import router as recipes_router

settings = get_settings()
app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=BASE_DIR / "uploads"), name="uploads")

app.include_router(health_router)
app.include_router(categories_router)
app.include_router(recipes_router)
app.include_router(menus_router)
app.include_router(ai_router)
