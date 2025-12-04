from fastapi import APIRouter
from .auth import router as auth_router
from .chat import router as chat_router
from .dashboard import router as dashboard_router
from .checkin import router as checkin_router
from .exercises import router as exercises_router
from .games import router as games_router
from .profile import router as profile_router
from .emotion import router as emotion_router
from .content import router as content_router

router = APIRouter()

router.include_router(auth_router, prefix="/auth", tags=["auth"])
router.include_router(chat_router, prefix="/chat", tags=["chat"])
router.include_router(dashboard_router, prefix="/dashboard", tags=["dashboard"])
router.include_router(checkin_router, prefix="/dashboard", tags=["checkins"])
router.include_router(exercises_router, prefix="/exercises", tags=["exercises"])
router.include_router(games_router, prefix="/games", tags=["games"])
router.include_router(profile_router, prefix="", tags=["profile"])
router.include_router(emotion_router, prefix="/emotion", tags=["emotion"])
router.include_router(content_router, prefix="/content", tags=["content"])
