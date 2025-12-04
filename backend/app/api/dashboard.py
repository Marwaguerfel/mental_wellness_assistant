from datetime import datetime
from collections import defaultdict

from fastapi import APIRouter, Depends

from app.schemas.dashboard import DashboardSummary, DaySummary
from app.core.mongo import db
from app.core.security import get_current_user
from app.schemas.auth import User

router = APIRouter()


def sentiment_to_score(label: str) -> float:
    mapping = {
        "very_negative": -1.0,
        "negative": -0.5,
        "neutral": 0.0,
        "positive": 1.0,
    }
    return mapping.get(label, 0.0)


async def _aggregate_for_user(user_id: str) -> DashboardSummary:
    cursor = db.chat_messages.find(
        {"user_id": user_id, "sender": "assistant"}
    ).sort("created_at", 1)
    docs = await cursor.to_list(length=2000)

    checkins = await db.mood_checkins.find({"user_id": user_id}).to_list(1000)

    per_day_sentiment = defaultdict(list)
    per_day_stress = defaultdict(list)

    for d in docs:
        created_at = d.get("created_at")
        if not created_at:
            continue

        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)

        day_key = created_at.date().isoformat()

        sentiment_label = d.get("sentiment_label", "neutral")
        stress_score = float(d.get("stress_score", 0.0))

        per_day_sentiment[day_key].append(sentiment_to_score(sentiment_label))
        per_day_stress[day_key].append(stress_score)

    # incorporate manual mood check-ins into sentiment aggregates
    mood_map = {
        "very_negative": -1.0,
        "negative": -0.5,
        "neutral": 0.0,
        "positive": 0.5,
        "very_positive": 1.0,
    }
    for c in checkins:
        created_at = c.get("created_at")
        if not created_at:
            continue
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
        day_key = created_at.date().isoformat()
        per_day_sentiment[day_key].append(mood_map.get(c.get("mood"), 0.0))

    days: list[DaySummary] = []
    high_stress_days = 0

    for day, sent_values in per_day_sentiment.items():
        stress_values = per_day_stress.get(day, [])
        if not stress_values:
            continue

        avg_sent = sum(sent_values) / len(sent_values)
        avg_stress = sum(stress_values) / len(stress_values)

        if avg_stress >= 0.7:
            high_stress_days += 1

        days.append(
            DaySummary(
                date=day,
                avg_sentiment=avg_sent,
                avg_stress=avg_stress,
            )
        )

    days.sort(key=lambda d: d.date)

    return DashboardSummary(
        user_id=user_id,
        days=days,
        high_stress_days=high_stress_days,
    )


@router.get("/summary/me", response_model=DashboardSummary)
async def get_my_dashboard(current_user: User = Depends(get_current_user)):
    return await _aggregate_for_user(current_user.id)
