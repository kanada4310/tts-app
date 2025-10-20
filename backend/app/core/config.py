"""Application configuration"""
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # API Keys
    anthropic_api_key: str
    openai_api_key: str

    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False

    # CORS
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    # Rate Limiting
    rate_limit_per_hour: int = 100

    # Image Processing
    max_image_size_mb: int = 10
    max_image_dimension: int = 2000
    image_quality: int = 85

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


# Global settings instance
settings = Settings()
