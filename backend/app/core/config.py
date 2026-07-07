"""
KRISHISEVA — Application Configuration.

All environment variables are loaded and validated here via Pydantic Settings.
Never hardcode secrets. Never import os.environ directly in other modules.
"""

from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Centralized, typed configuration loaded from .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ──
    app_name: str = "KRISHISEVA"
    app_version: str = "1.0.0"
    debug: bool = False
    environment: str = "development"

    # ── Database ──
    database_url: str = "postgresql+asyncpg://krishiseva:krishiseva_secret@db:5432/krishiseva"
    database_echo: bool = False

    # ── Auth / JWT ──
    jwt_secret_key: str = "change-this-to-a-strong-random-secret-key-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 15
    jwt_refresh_token_expire_days: int = 7

    # ── AI / NVIDIA API ──
    nvidia_api_key: str = ""
    nvidia_api_base_url: str = "https://integrate.api.nvidia.com/v1"
    nvidia_vision_model: str = "meta/llama-4-maverick-17b-128e-instruct"

    # ── Aadhaar Mock Service ──
    aadhaar_service_url: str = "http://mock-aadhaar:8001"

    # ── File Uploads ──
    upload_dir: str = "./uploads"
    max_upload_size_mb: int = 10

    # ── CORS ──
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Accept both JSON list string and Python list."""
        if isinstance(v, str):
            import json
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [origin.strip() for origin in v.split(",")]
        return v

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024


# Singleton — import this everywhere
settings = Settings()
