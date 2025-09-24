
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from app.core.config import settings
from app.routers.health import router as health_router
from app.routers.meals import router as meals_router
from app.routers.users import router as users_router
from app.routers.workouts import router as workouts_router
from app.routers.goals import router as goals_router
from app.infra.db import lifespan

# Create FastAPI app with proper metadata
app = FastAPI(
    title="AI Fitness + Nutrition API",
    description="An intelligent fitness and nutrition tracking platform with AI-powered meal analysis and planning",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Security middleware
if settings.APP_ENV == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["*"]  # Configure properly for production
    )

# CORS middleware
origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health_router, prefix="/health", tags=["health"])
app.include_router(meals_router)
app.include_router(users_router)
app.include_router(workouts_router)
app.include_router(goals_router)

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "AI Fitness + Nutrition API",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health/health"
    }
