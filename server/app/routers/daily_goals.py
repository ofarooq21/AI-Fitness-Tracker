from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.infra.db import get_db
from app.models.daily_goal import DailyTaskCreate, DailyTaskUpdate, DailyTaskOut
from app.core.auth import get_current_user, get_current_user_optional
import uuid

router = APIRouter(prefix="/daily-goals", tags=["daily-goals"])

@router.post("", response_model=DailyTaskOut, status_code=status.HTTP_201_CREATED)
async def create_daily_task(
    task_data: DailyTaskCreate,
    current_user: dict = Depends(get_current_user_optional),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create a new daily task."""
    # Use authenticated user_id if available, otherwise use provided user_id
    user_id = current_user.get("user_id") if current_user else task_data.user_id
    
    # Check if task already exists for this user, date, and task_id
    existing = await db.daily_tasks.find_one({
        "user_id": user_id,
        "date": task_data.date,
        "task_id": task_data.task_id
    })
    
    if existing:
        # Update existing task instead of creating duplicate
        return await update_daily_task(
            str(existing["_id"]),
            DailyTaskUpdate(
                current=task_data.current,
                done=task_data.done,
                target=task_data.target
            ),
            current_user,
            db
        )
    
    # Create new task
    task_id = str(uuid.uuid4())
    task_doc = {
        "_id": task_id,
        "user_id": user_id,
        "date": task_data.date,
        "task_id": task_data.task_id,
        "label": task_data.label,
        "type": task_data.type,
        "target": task_data.target,
        "unit": task_data.unit,
        "current": task_data.current,
        "done": task_data.done,
        "is_custom": task_data.is_custom,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.daily_tasks.insert_one(task_doc)
    
    return DailyTaskOut(**task_doc)

@router.get("", response_model=List[DailyTaskOut])
async def list_daily_tasks(
    date: str = Query(..., description="Date in YYYY-MM-DD format"),
    current_user: dict = Depends(get_current_user_optional),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get all daily tasks for a specific date."""
    # Use authenticated user_id if available
    user_id = current_user.get("user_id") if current_user else "guest"
    
    cursor = db.daily_tasks.find({
        "user_id": user_id,
        "date": date
    }).sort("created_at", 1)
    
    tasks = await cursor.to_list(length=100)
    return [DailyTaskOut(**task) for task in tasks]

@router.get("/{task_id}", response_model=DailyTaskOut)
async def get_daily_task(
    task_id: str,
    current_user: dict = Depends(get_current_user_optional),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get a specific daily task."""
    task = await db.daily_tasks.find_one({"_id": task_id})
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Verify ownership if authenticated
    if current_user and task["user_id"] != current_user.get("user_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this task"
        )
    
    return DailyTaskOut(**task)

@router.put("/{task_id}", response_model=DailyTaskOut)
async def update_daily_task(
    task_id: str,
    task_update: DailyTaskUpdate,
    current_user: dict = Depends(get_current_user_optional),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update a daily task."""
    task = await db.daily_tasks.find_one({"_id": task_id})
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Verify ownership if authenticated
    if current_user and task["user_id"] != current_user.get("user_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this task"
        )
    
    # Update fields
    update_data = {k: v for k, v in task_update.dict().items() if v is not None}
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        await db.daily_tasks.update_one(
            {"_id": task_id},
            {"$set": update_data}
        )
    
    # Return updated task
    updated_task = await db.daily_tasks.find_one({"_id": task_id})
    return DailyTaskOut(**updated_task)

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_daily_task(
    task_id: str,
    current_user: dict = Depends(get_current_user_optional),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Delete a daily task."""
    task = await db.daily_tasks.find_one({"_id": task_id})
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Verify ownership if authenticated
    if current_user and task["user_id"] != current_user.get("user_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this task"
        )
    
    await db.daily_tasks.delete_one({"_id": task_id})
    return None

@router.post("/bulk", response_model=List[DailyTaskOut])
async def bulk_create_or_update_tasks(
    tasks: List[DailyTaskCreate],
    current_user: dict = Depends(get_current_user_optional),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Bulk create or update daily tasks for a date. This replaces all tasks for the date."""
    user_id = current_user.get("user_id") if current_user else tasks[0].user_id if tasks else "guest"
    
    # Get the date from the first task (all tasks should have the same date)
    date = tasks[0].date if tasks else None
    
    if date:
        # Get all existing tasks for this user and date
        existing_tasks = await db.daily_tasks.find({
            "user_id": user_id,
            "date": date
        }).to_list(length=100)
        
        # Get task_ids from the new task list
        new_task_ids = {task.task_id for task in tasks}
        
        # Delete tasks that are no longer in the new list
        for existing in existing_tasks:
            if existing["task_id"] not in new_task_ids:
                await db.daily_tasks.delete_one({"_id": existing["_id"]})
    
    result_tasks = []
    for task_data in tasks:
        # Check if task exists
        existing = await db.daily_tasks.find_one({
            "user_id": user_id,
            "date": task_data.date,
            "task_id": task_data.task_id
        })
        
        if existing:
            # Update existing
            update_data = {
                "current": task_data.current,
                "done": task_data.done,
                "target": task_data.target,
                "label": task_data.label,
                "updated_at": datetime.utcnow()
            }
            await db.daily_tasks.update_one(
                {"_id": existing["_id"]},
                {"$set": update_data}
            )
            updated = await db.daily_tasks.find_one({"_id": existing["_id"]})
            result_tasks.append(DailyTaskOut(**updated))
        else:
            # Create new
            task_id = str(uuid.uuid4())
            task_doc = {
                "_id": task_id,
                "user_id": user_id,
                "date": task_data.date,
                "task_id": task_data.task_id,
                "label": task_data.label,
                "type": task_data.type,
                "target": task_data.target,
                "unit": task_data.unit,
                "current": task_data.current,
                "done": task_data.done,
                "is_custom": task_data.is_custom,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await db.daily_tasks.insert_one(task_doc)
            result_tasks.append(DailyTaskOut(**task_doc))
    
    return result_tasks

