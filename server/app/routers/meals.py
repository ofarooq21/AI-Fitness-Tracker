from typing import Any, Dict, List, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from celery.result import AsyncResult
from app.infra.s3 import create_presigned_post
from app.core.config import settings
from app.workers.tasks import classify_meal_task
from app.infra.db import get_db
from app.models.meal import MealCreate, MealOut, MealUpdate, MealSummary, DailyNutrition, MealType, Macros
from app.core.auth import get_current_user_optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from celery_app import celery_app
import uuid

router = APIRouter(prefix="/meals", tags=["meals"])



# ---------- AI/ML Schemas ----------

class PresignResponse(BaseModel):
    url: str
    fields: Dict[str, Any]

class ScanRequest(BaseModel):
    file_key: str

class ClassificationResult(BaseModel):
    file_key: str
    label: str
    confidence: float
    portion_estimate_grams: int
    macros: Dict[str, Any]

class JobStatusResponse(BaseModel):
    task_id: str
    status: str
    result: ClassificationResult | None = None


# ---------- Routes ----------

@router.get("/presign", response_model=PresignResponse)
async def presign_upload(
    file_key: str = Query(..., description="Object key to write in the uploads bucket"),
    content_type: str = Query("image/jpeg"),
) -> PresignResponse:
    """
    Return a presigned *POST* so the client can upload directly to MinIO/S3.
    """
    post = create_presigned_post(bucket=settings.S3_BUCKET, key=file_key, content_type=content_type)
    return PresignResponse(**post)


@router.post("/scan", response_model=JobStatusResponse)
async def queue_scan(payload: ScanRequest) -> JobStatusResponse:
    """
    Enqueue a classification job for an uploaded image.
    """
    async_result = classify_meal_task.delay(payload.file_key)
    return JobStatusResponse(task_id=async_result.id, status="QUEUED")


@router.get("/jobs/{task_id}", response_model=JobStatusResponse)
async def job_status(
    task_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> JobStatusResponse:
    """
    Poll a Celery task. When it succeeds, persist the result to Mongo (idempotently)
    and return it to the client.
    """
    ar = AsyncResult(task_id, app=celery_app)
    status = ar.status  # PENDING, STARTED, RETRY, FAILURE, SUCCESS

    if status == "SUCCESS":
        raw: Dict[str, Any] = ar.result or {}
        try:
            result = ClassificationResult(**raw)
        except Exception as e:
            # Worker returned unexpected shape; treat as server error.
            raise HTTPException(status_code=500, detail=f"Malformed task result: {e}")

        # Upsert into Mongo so repeated polls don't duplicate documents.
        now = datetime.utcnow()
        doc = {
            "task_id": task_id,
            "file_key": result.file_key,
            "label": result.label,
            "confidence": result.confidence,
            "portion_estimate_grams": result.portion_estimate_grams,
            "macros": result.macros,
            "created_at": now,
        }

        col = db.get_collection("meals")
        # Idempotent upsert by task_id
        await col.update_one(
            {"task_id": task_id},
            {"$setOnInsert": doc},
            upsert=True
        )

        resp = JobStatusResponse(
            task_id=task_id,
            status="SUCCESS",
            result=result,
        )
        return resp

    if status == "FAILURE":
        # Include a minimal hint; avoid leaking stacktraces.
        raise HTTPException(status_code=500, detail="Classification task failed")

    # PENDING / STARTED / RETRY
    return JobStatusResponse(task_id=task_id, status=status)


@router.post("", response_model=MealOut, status_code=status.HTTP_201_CREATED)
async def create_meal(
    meal_data: MealCreate,
    current_user: dict = Depends(get_current_user_optional),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create a new meal entry."""
    meal_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    # Use current user's ID if available
    if current_user:
        meal_data.user_id = current_user.get("user_id", "demo")
    
    meal_doc = {
        "_id": meal_id,
        **meal_data.dict(),
        "created_at": now,
        "updated_at": now
    }
    
    await db.meals.insert_one(meal_doc)
    
    return MealOut(**meal_doc)

@router.get("", response_model=List[MealOut])
async def list_meals(
    user_id: Optional[str] = Query(None),
    meal_type: Optional[MealType] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user_optional),
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> List[MealOut]:
    """
    List meals for a user with optional filtering.
    """
    # Use current user's ID if not specified
    if not user_id and current_user:
        user_id = current_user.get("user_id", "demo")
    elif not user_id:
        user_id = "demo"  # Fallback for demo mode
    
    query = {"user_id": user_id}
    
    if meal_type:
        query["meal_type"] = meal_type
    
    if date_from or date_to:
        date_filter = {}
        if date_from:
            date_filter["$gte"] = datetime.combine(date_from, datetime.min.time())
        if date_to:
            date_filter["$lte"] = datetime.combine(date_to, datetime.max.time())
        query["created_at"] = date_filter
    
    cursor = db.meals.find(query).sort("created_at", -1).skip(skip).limit(limit)
    
    meals = []
    async for doc in cursor:
        meals.append(MealOut(**doc))
    
    return meals

@router.get("/{meal_id}", response_model=MealOut)
async def get_meal(
    meal_id: str,
    current_user: dict = Depends(get_current_user_optional),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get a specific meal by ID."""
    meal = await db.meals.find_one({"_id": meal_id})
    if not meal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal not found"
        )
    
    return MealOut(**meal)

@router.put("/{meal_id}", response_model=MealOut)
async def update_meal(
    meal_id: str,
    meal_update: MealUpdate,
    current_user: dict = Depends(get_current_user_optional),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update a meal."""
    # Check if meal exists
    existing_meal = await db.meals.find_one({"_id": meal_id})
    if not existing_meal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal not found"
        )
    
    # Update only provided fields
    update_data = {k: v for k, v in meal_update.dict().items() if v is not None}
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        await db.meals.update_one(
            {"_id": meal_id},
            {"$set": update_data}
        )
    
    # Return updated meal
    updated_meal = await db.meals.find_one({"_id": meal_id})
    return MealOut(**updated_meal)

@router.delete("/{meal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_meal(
    meal_id: str,
    current_user: dict = Depends(get_current_user_optional),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Delete a meal."""
    result = await db.meals.delete_one({"_id": meal_id})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal not found"
        )

@router.get("/daily/{target_date}", response_model=DailyNutrition)
async def get_daily_nutrition(
    target_date: date,
    user_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user_optional),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get daily nutrition summary for a specific date."""
    # Use current user's ID if not specified
    if not user_id and current_user:
        user_id = current_user.get("user_id", "demo")
    elif not user_id:
        user_id = "demo"  # Fallback for demo mode
    
    # Calculate date range for the target date
    start_datetime = datetime.combine(target_date, datetime.min.time())
    end_datetime = datetime.combine(target_date, datetime.max.time())
    
    # Get all meals for the date
    query = {
        "user_id": user_id,
        "created_at": {"$gte": start_datetime, "$lte": end_datetime}
    }
    
    cursor = db.meals.find(query).sort("created_at", 1)
    meals = []
    total_macros = Macros(kcal=0, protein_g=0.0, carbs_g=0.0, fat_g=0.0)
    
    async for doc in cursor:
        meal_summary = MealSummary(
            id=str(doc["_id"]),
            label=doc["label"],
            meal_type=doc["meal_type"],
            macros=Macros(**doc["macros"]),
            created_at=doc["created_at"]
        )
        meals.append(meal_summary)
        
        # Add to total macros
        total_macros.kcal += doc["macros"]["kcal"]
        total_macros.protein_g += doc["macros"]["protein_g"]
        total_macros.carbs_g += doc["macros"]["carbs_g"]
        total_macros.fat_g += doc["macros"]["fat_g"]
    
    return DailyNutrition(
        date=target_date,
        total_macros=total_macros,
        meals=meals
    )
