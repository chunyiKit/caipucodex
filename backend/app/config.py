from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads" / "recipes"


class Settings(BaseSettings):
    app_name: str = "CaipuCodex API"
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    frontend_origin: str = "http://localhost:5173"
    database_url: str = "sqlite:///./caipucodex.db"
    openai_api_key: str = ""
    openai_base_url: str | None = None
    openai_model: str = "gpt-4o-mini"
    openai_timeout_seconds: int = 30
    ark_api_key: str = ""
    ark_base_url: str = "https://ark.cn-beijing.volces.com/api/v3"
    ark_image_model: str = "doubao-seedream-5-0-260128"

    model_config = SettingsConfigDict(
        env_file=(BASE_DIR.parent / ".env", BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("database_url")
    @classmethod
    def normalize_sqlite_path(cls, value: str) -> str:
        if value.startswith("sqlite:///./"):
            db_name = value.removeprefix("sqlite:///./")
            return f"sqlite:///{(BASE_DIR / db_name).resolve()}"
        return value


@lru_cache
def get_settings() -> Settings:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    return Settings()
