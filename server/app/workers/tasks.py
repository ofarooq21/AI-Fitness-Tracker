
import time
from celery import shared_task

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
