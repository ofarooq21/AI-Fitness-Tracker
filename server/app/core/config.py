
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # App Configuration
    APP_ENV: str = "local"
    ALLOWED_ORIGINS: str = "*"
    
    # Database
    MONGO_URL: str = "mongodb://mongo:27017"
    MONGO_DB: str = "fitapp"
    
    # Redis/Celery
    REDIS_URL: str = "redis://redis:6379/0"
    CELERY_BROKER_URL: str = "redis://redis:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/0"
    
    # S3/MinIO
    S3_ENDPOINT: str = "http://minio:9000"
    S3_REGION: str = "us-east-1"
    S3_BUCKET: str = "uploads"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_USE_SSL: bool = False
    
    # AI Services
    OPENAI_API_KEY: str = "REPLACE_ME"
    
    # JWT Configuration
    JWT_SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
