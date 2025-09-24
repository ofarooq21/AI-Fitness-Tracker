from contextlib import asynccontextmanager
from typing import AsyncIterator
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None

def get_db() -> AsyncIOMotorDatabase:
    """Get the database instance. Must be called after app startup."""
    if _db is None:
        raise RuntimeError("Database not initialized. Call this after app startup.")
    return _db

async def _create_indexes(db: AsyncIOMotorDatabase):
    """Create database indexes for optimal query performance."""
    try:
        # Meals collection indexes
        await db.meals.create_index([("user_id", 1)])
        await db.meals.create_index([("task_id", 1)], unique=True, sparse=True)
        await db.meals.create_index([("created_at", -1)])
        await db.meals.create_index([("user_id", 1), ("created_at", -1)])
        
        # Users collection indexes
        await db.users.create_index([("email", 1)], unique=True)
        await db.users.create_index([("created_at", -1)])
        
        # Workouts collection indexes
        await db.workouts.create_index([("user_id", 1)])
        await db.workouts.create_index([("user_id", 1), ("date", -1)])
        await db.workouts.create_index([("created_at", -1)])
        
        # Goals collection indexes
        await db.goals.create_index([("user_id", 1)])
        await db.goals.create_index([("user_id", 1), ("status", 1)])
        await db.goals.create_index([("user_id", 1), ("is_primary", 1)])
        await db.goals.create_index([("created_at", -1)])
        
    except Exception as e:
        logger.error(f"Failed to create database indexes: {e}")
        raise

@asynccontextmanager
async def lifespan(app) -> AsyncIterator[None]:
    """Application lifespan manager for database connections."""
    global _client, _db
    
    try:
        # Initialize MongoDB connection
        _client = AsyncIOMotorClient(
            settings.MONGO_URL,
            uuidRepresentation="standard",
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000
        )
        
        # Test connection
        await _client.admin.command('ping')
        
        _db = _client[settings.MONGO_DB]
        await _create_indexes(_db)
        
        yield
        
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        raise
    finally:
        if _client:
            _client.close()
