from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.mongo import db
from app.core.security import get_current_user
from app.schemas.auth import User

router = APIRouter()

VALID_MOODS = [
    "very_negative",
    "negative",
    "neutral",
    "positive",
    "very_positive",
]


@router.post("/checkin", status_code=status.HTTP_201_CREATED)
async def create_checkin(
    mood: str = Query(..., description="Mood label"),
    current_user: User = Depends(get_current_user),
):
    """Create a quick mood check-in for the authenticated user."""
    if mood not in VALID_MOODS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid mood value"
        )

    await db.mood_checkins.insert_one(
        {
            "user_id": current_user.id,
            "mood": mood,
            "created_at": datetime.utcnow(),
        }
    )

    return {"message": "Check-in saved", "mood": mood}
