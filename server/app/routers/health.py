
from fastapi import APIRouter, Depends
from app.infra.db import get_db
from motor.motor_asyncio import AsyncIOMotorDatabase
import time

router = APIRouter()

@router.get("/health")
async def health():
    """Basic health check endpoint."""
    return {
        "status": "ok",
        "timestamp": time.time(),
        "service": "ai-fitness-api"
    }

@router.get("/detailed")
async def detailed_health(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Detailed health check including database connectivity."""
    try:
        # Test database connection
        await db.command("ping")
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    return {
        "status": "ok",
        "timestamp": time.time(),
        "service": "ai-fitness-api",
        "database": db_status,
        "version": "0.1.0"
    }
