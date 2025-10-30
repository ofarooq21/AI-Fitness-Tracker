
import time
from celery import shared_task
import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

# --- Utilities for forecasting ---

def estimate_1rm_epley(weight_kg: float, reps: int) -> float:
    if weight_kg is None or reps is None or reps <= 0:
        return 0.0
    return float(weight_kg * (1 + reps / 30.0))

def simple_linear_regression(points: List[Tuple[float, float]]) -> Tuple[float, float, float]:
    """Return (slope, intercept, r_squared) for list of (x, y)."""
    n = len(points)
    if n < 2:
        return 0.0, 0.0, 0.0
    sum_x = sum(p[0] for p in points)
    sum_y = sum(p[1] for p in points)
    sum_xx = sum(p[0] * p[0] for p in points)
    sum_xy = sum(p[0] * p[1] for p in points)
    denom = (n * sum_xx - sum_x * sum_x)
    if denom == 0:
        return 0.0, 0.0, 0.0
    slope = (n * sum_xy - sum_x * sum_y) / denom
    intercept = (sum_y - slope * sum_x) / n
    # r^2
    mean_y = sum_y / n
    ss_tot = sum((p[1] - mean_y) ** 2 for p in points)
    ss_res = sum((p[1] - (slope * p[0] + intercept)) ** 2 for p in points)
    r2 = 0.0 if ss_tot == 0 else max(0.0, 1 - ss_res / ss_tot)
    return float(slope), float(intercept), float(r2)

async def _async_compute_strength_forecast(user_id: str) -> None:
    client = AsyncIOMotorClient(settings.MONGO_URL, uuidRepresentation="standard")
    db = client[settings.MONGO_DB]

    try:
        # Load workouts for user
        cursor = db.workouts.find({"user_id": user_id})
        workouts: List[Dict[str, Any]] = [doc async for doc in cursor]

        # Build 1RM timeseries per exercise
        # Map: exercise_name -> list of (timestamp_days, est_1rm)
        series: Dict[str, List[Tuple[float, float]]] = {}
        latest_current: Dict[str, float] = {}

        for w in workouts:
            date: datetime = w.get("date") or w.get("created_at") or datetime.now(timezone.utc)
            # convert to UTC timestamp in days
            ts_days = (date.replace(tzinfo=timezone.utc).timestamp()) / 86400.0
            for ex in (w.get("exercises") or []):
                if ex.get("exercise_type") != "strength":
                    continue
                name = ex.get("name") or "Unknown"
                for s in (ex.get("sets") or []):
                    reps = s.get("reps")
                    weight = s.get("weight_kg")
                    if weight is None or reps is None:
                        continue
                    one_rm = estimate_1rm_epley(float(weight), int(reps))
                    series.setdefault(name, []).append((ts_days, one_rm))
                    latest_current[name] = max(latest_current.get(name, 0.0), one_rm)

        # Load active strength goals to get targets
        goals_cursor = db.goals.find({"user_id": user_id, "goal_type": "strength", "status": "active"})
        goals: List[Dict[str, Any]] = [doc async for doc in goals_cursor]

        # Forecast per exercise found in either series or goals
        forecasts_collection = db.get_collection("forecasts")
        now_ts_days = datetime.now(timezone.utc).timestamp() / 86400.0

        results: List[Dict[str, Any]] = []

        # Helper to convert target weight+reps to target 1RM
        def target_1rm(item: Dict[str, Any]) -> float:
            weight = float(item.get("target_weight_kg") or 0.0)
            reps = int(item.get("target_reps") or 1)
            return estimate_1rm_epley(weight, reps)

        # Build a map of exercise targets from goals
        goal_targets: Dict[str, float] = {}
        for g in goals:
            for sg in (g.get("strength_goals") or []):
                ex_name = sg.get("exercise_name") or "Unknown"
                goal_targets[ex_name] = target_1rm(sg)

        # Compute regression and ETA
        for ex_name, points in series.items():
            points_sorted = sorted(points, key=lambda p: p[0])
            slope, intercept, r2 = simple_linear_regression(points_sorted)
            current_1rm = latest_current.get(ex_name, 0.0)
            target = goal_targets.get(ex_name)

            eta_date: Optional[datetime] = None  # type: ignore[name-defined]
            if target is not None and slope > 0:
                # Solve for t where slope*t + intercept = target
                t_days = (target - intercept) / slope
                if t_days > now_ts_days - 36500 and t_days < now_ts_days + 36500:
                    eta_date = datetime.fromtimestamp(t_days * 86400.0, tz=timezone.utc)

            doc = {
                "user_id": user_id,
                "exercise_name": ex_name,
                "current_1rm_kg": round(current_1rm, 2),
                "target_1rm_kg": round(target, 2) if target is not None else None,
                "estimated_completion_date": eta_date,
                "confidence_score": round(r2, 3),
                "updated_at": datetime.now(timezone.utc),
            }
            # Upsert by (user_id, exercise_name)
            await forecasts_collection.update_one(
                {"user_id": user_id, "exercise_name": ex_name},
                {"$set": doc},
                upsert=True,
            )
            results.append(doc)

        # Also handle goals with no data yet: create placeholders
        for ex_name, target in goal_targets.items():
            if ex_name in series:
                continue
            doc = {
                "user_id": user_id,
                "exercise_name": ex_name,
                "current_1rm_kg": None,
                "target_1rm_kg": round(target, 2),
                "estimated_completion_date": None,
                "confidence_score": 0.0,
                "updated_at": datetime.now(timezone.utc),
            }
            await forecasts_collection.update_one(
                {"user_id": user_id, "exercise_name": ex_name},
                {"$set": doc},
                upsert=True,
            )

    finally:
        client.close()

@shared_task(name="classify_meal_task")
def classify_meal_task(file_key: str):
    """
    TODO: Replace with real Food-101 model inference + nutrition lookup
    This is a placeholder that simulates the ML pipeline.
    """
    time.sleep(2)  # Simulate processing time
    
    # Dummy result - replace with actual ML model inference
    return {
        "file_key": file_key,
        "label": "spaghetti bolognese",
        "confidence": 0.87,
        "portion_estimate_grams": 300,
        "macros": {
            "kcal": 600,
            "protein_g": 25,
            "carbs_g": 75,
            "fat_g": 20
        },
    }


@shared_task(name="compute_strength_forecast")
def compute_strength_forecast(user_id: str):
    """Recompute strength forecast artifacts for a user."""
    asyncio.run(_async_compute_strength_forecast(user_id))
