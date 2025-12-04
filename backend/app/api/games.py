from typing import Literal, Tuple

from fastapi import APIRouter, Depends

from app.core.mongo import db
from app.core.security import get_current_user
from app.schemas.auth import User

router = APIRouter()

GameType = Literal["focus", "memory", "relax"]


def choose_game_from_stress(stress_score: float, risk_flag: bool) -> Tuple[GameType, str]:
    """
    Heuristic:
    - High risk or very high stress -> focus (breathing orb)
    - Medium stress -> relax (floating shapes)
    - Low stress -> memory (cubes)
    """
    if risk_flag or stress_score >= 0.75:
        return (
            "focus",
            "High stress detected. A guided breathing focus game is suggested.",
        )
    if stress_score >= 0.4:
        return (
            "relax",
            "Stress is moderate. A relaxation scene may help you unwind.",
        )
    return (
        "memory",
        "Stress is relatively low. A gentle memory game can support focus.",
    )


@router.get("/recommend")
async def recommend_game(current_user: User = Depends(get_current_user)):
    """
    Recommend one of: focus / memory / relax, based on latest assistant stress info.
    """
    cursor = (
        db.chat_messages.find(
            {"user_id": current_user.id, "sender": "assistant"}
        )
        .sort("created_at", -1)
        .limit(1)
    )
    docs = await cursor.to_list(length=1)

    if not docs:
        return {
            "suggested_game": "focus",
            "reason": "No stress data yet. Start with a simple focus breathing exercise.",
            "stress_score": None,
            "risk_flag": False,
        }

    last = docs[0]
    stress_score = float(last.get("stress_score", 0.0))
    risk_flag = bool(last.get("risk_flag", False))

    suggested_game, reason = choose_game_from_stress(stress_score, risk_flag)

    return {
        "suggested_game": suggested_game,
        "reason": reason,
        "stress_score": stress_score,
        "risk_flag": risk_flag,
    }
