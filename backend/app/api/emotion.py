import os
from datetime import datetime

import httpx
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.core.mongo import db
from app.core.security import get_current_user
from app.schemas.auth import User

router = APIRouter()

ML_SERVICE_URL = os.getenv("ML_SERVICE_URL", "http://127.0.0.1:8002")


@router.post("/face")
async def analyze_face_emotion(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Forward an uploaded face image to the ML service, store the result, and return it.
    """
    content = await file.read()
    files = {
        "file": (
            file.filename or "face.jpg",
            content,
            file.content_type or "image/jpeg",
        )
    }

    try:
        async with httpx.AsyncClient(timeout=40) as client:
            resp = await client.post(f"{ML_SERVICE_URL}/api/emotion/face", files=files)
        resp.raise_for_status()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"ML service error: {e}")

    data = resp.json()
    emotion = data.get("emotion")
    scores = data.get("scores")

    await db.face_emotions.insert_one(
        {
            "user_id": current_user.id,
            "emotion": emotion,
            "scores": scores,
            "created_at": datetime.utcnow(),
        }
    )

    return {"emotion": emotion, "scores": scores}
