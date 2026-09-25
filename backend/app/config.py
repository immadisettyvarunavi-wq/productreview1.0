"""Application configuration via environment variables."""

from pydantic_settings import BaseSettings
from typing import List
from pathlib import Path


class Settings(BaseSettings):
    """All configuration is loaded from environment variables / .env file."""

    # --- API Keys (NEVER exposed to frontend) ---
    SERPAPI_API_KEY: str = ""
    HUGGINGFACE_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    OPENAI_API_KEY: str = ""

    # --- Database ---
    DATABASE_URL: str = "sqlite+aiosqlite:///./reviewai.db"
    MYSQL_URL: str = "mysql+aiomysql://root:123456@localhost:3306/reviewly_db"

    # --- JWT Auth ---
    JWT_SECRET_KEY: str = "reviewly_super_secret_key_2024_change_in_production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 1440  # 24 hours

    # --- File Upload ---
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 10
    SERPAPI_MAX_IMAGE_KB: int = 500  # SerpApi Image API limit

    # --- Caching ---
    CACHE_TTL_HOURS: int = 12
    PRICE_CACHE_TTL_MINUTES: int = 60
    REVIEW_CACHE_TTL_HOURS: int = 6

    # --- Rate Limiting ---
    RATE_LIMIT_REQUESTS: int = 10
    RATE_LIMIT_WINDOW_MINUTES: int = 1

    # --- SerpApi ---
    SERPAPI_BASE_URL: str = "https://serpapi.com"
    SERPAPI_TIMEOUT_SECONDS: int = 30
    SERPAPI_MAX_RETRIES: int = 3

    # --- LLM ---
    LLM_MODEL: str = "Qwen/Qwen2.5-72B-Instruct"
    LLM_TIMEOUT_SECONDS: int = 60

    # --- Product Matching ---
    MATCH_CONFIDENCE_THRESHOLD: float = 0.75
    AMBIGUOUS_THRESHOLD: float = 0.50

    # --- Allowed image types ---
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp"]
    ALLOWED_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png", ".webp"]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

    def ensure_upload_dir(self) -> Path:
        """Create upload directory if it doesn't exist."""
        path = Path(self.UPLOAD_DIR)
        path.mkdir(parents=True, exist_ok=True)
        return path


settings = Settings()
