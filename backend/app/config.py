from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    DATABASE_URL: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5432/digital_onboarding"
    )
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 10080
    UPLOAD_DIR: str = "./uploads"
    TEMPLATE_DIR: str = "./templates"
    S3_BUCKET: Optional[str] = None
    CORS_ORIGINS: list[str] = ["http://localhost:4200"]
    INVITATION_EXPIRY_DAYS: int = 30
    FRONTEND_URL: str = "http://localhost:4200"
    SLA_WARNING_DAYS: int = 7
    SLA_CRITICAL_DAYS: int = 14
    STUCK_STEP_THRESHOLD_DAYS: int = 7

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
