from typing import List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.mongo import db
from app.core.security import get_current_user
from app.schemas.auth import User
from app.schemas.exercises import (
    Exercise,
    ExerciseRecommendResponse,
    ExerciseSearchResponse,
    ExerciseType,
)

router = APIRouter()


def doc_to_exercise(doc) -> Exercise:
    return Exercise(
        id=str(doc["_id"]),
        title=doc["title"],
        type=doc["type"],
        duration_minutes=int(doc.get("duration_minutes", 5)),
        difficulty=doc.get("difficulty", "easy"),
        tags=doc.get("tags", []),
        description=doc.get("description", ""),
        steps=doc.get("steps", []),
    )


@router.post("/seed-dev", status_code=status.HTTP_201_CREATED)
async def seed_dev_exercises(current_user: User = Depends(get_current_user)):
    """Dev-only seeding endpoint for quick exercises."""
    count = await db.exercises.count_documents({})
    if count > 0:
        return {"message": "Exercises already exist, skipping seeding."}

    docs = [
        {
            "_id": str(uuid4()),
            "title": "Box breathing (4-4-4-4)",
            "type": "breathing",
            "duration_minutes": 5,
            "difficulty": "easy",
            "tags": ["anxiety", "panic", "sleep"],
            "description": "A simple paced breathing technique to calm your nervous system.",
            "steps": [
                "Sit comfortably with your feet on the floor.",
                "Inhale gently through your nose for 4 seconds.",
                "Hold your breath for 4 seconds.",
                "Exhale slowly through your mouth for 4 seconds.",
                "Pause for 4 seconds before the next inhale.",
                "Repeat for 4–6 cycles, staying aware of the air moving in and out.",
            ],
        },
        {
            "_id": str(uuid4()),
            "title": "5-4-3-2-1 grounding",
            "type": "grounding",
            "duration_minutes": 7,
            "difficulty": "easy",
            "tags": ["anxiety", "dissociation", "panic"],
            "description": "Use your senses to bring yourself back to the present moment.",
            "steps": [
                "Look around and name 5 things you can see.",
                "Name 4 things you can feel (e.g., your feet on the floor).",
                "Name 3 things you can hear.",
                "Name 2 things you can smell (or recall smells you like).",
                "Name 1 thing you can taste or a taste you enjoy.",
                "Take a slow breath and notice how your body feels now.",
            ],
        },
        {
            "_id": str(uuid4()),
            "title": "Evening reflection journaling",
            "type": "journaling",
            "duration_minutes": 10,
            "difficulty": "medium",
            "tags": ["stress", "reflection", "sleep"],
            "description": "Process your day and prepare for rest with a short writing routine.",
            "steps": [
                "Write down three things that happened today (small or big).",
                "For each one, note how it made you feel.",
                "Write one thing you are grateful for, even if it’s small.",
                "Write one thing you would like to let go of before sleep.",
                "Close with one kind sentence to yourself (e.g., \"I did my best today\").",
            ],
        },
    ]

    await db.exercises.insert_many(docs)
    return {"message": "Seeded example exercises", "count": len(docs)}


@router.get("/search", response_model=ExerciseSearchResponse)
async def search_exercises(
    q: Optional[str] = Query(None, description="Optional search text"),
    type: Optional[ExerciseType] = Query(None, description="Filter by type"),
    limit: int = 10,
    current_user: User = Depends(get_current_user),
):
    """
    Simple search with optional type filter and text regex on title/description/tags.
    """
    query: dict = {}

    if type:
        query["type"] = type

    if q:
        regex = {"$regex": q, "$options": "i"}
        query["$or"] = [
            {"title": regex},
            {"description": regex},
            {"tags": regex},
        ]

    cursor = db.exercises.find(query).limit(limit)
    docs = await cursor.to_list(length=limit)

    items: List[Exercise] = [doc_to_exercise(d) for d in docs]
    return ExerciseSearchResponse(items=items)


@router.get("/recommend", response_model=ExerciseRecommendResponse)
async def recommend_exercises(
    current_user: User = Depends(get_current_user),
    limit: int = 5,
):
    """
    Recommend exercises based on the latest assistant messages and stress signals.
    """
    cursor = (
        db.chat_messages.find({"user_id": current_user.id, "sender": "assistant"})
        .sort("created_at", -1)
        .limit(5)
    )
    last_msgs = await cursor.to_list(length=5)

    # default fallback
    types: List[ExerciseType] = ["breathing", "grounding", "journaling"]

    if last_msgs:
        last = next((m for m in last_msgs if "stress_score" in m), last_msgs[0])
        stress_score = float(last.get("stress_score", 0.0))
        stress_label = last.get("stress_label", "not_stressed")
        risk_flag = bool(last.get("risk_flag", False))

        if risk_flag or stress_score >= 0.75:
            types = ["breathing", "grounding"]
        elif stress_score >= 0.4 or stress_label == "stressed":
            types = ["grounding", "breathing", "journaling"]
        else:
            types = ["journaling", "grounding", "breathing"]

    cursor2 = db.exercises.find({"type": {"$in": types}}).limit(limit)
    docs = await cursor2.to_list(length=limit)
    items = [doc_to_exercise(d) for d in docs]

    return ExerciseRecommendResponse(items=items)
