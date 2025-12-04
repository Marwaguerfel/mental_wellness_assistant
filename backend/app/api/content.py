from fastapi import APIRouter
from app.schemas.content import ExercisesResponse, GamesResponse, Exercise, Game

router = APIRouter()


@router.get("/exercises", response_model=ExercisesResponse)
def list_exercises():
    items = [
        Exercise(
            id="breath-1",
            title="2-minute breathing exercise",
            category="breathing",
            description="Inhale 4s, hold 4s, exhale 6s."
        ),
        Exercise(
            id="ground-1",
            title="5-4-3-2-1 grounding",
            category="grounding",
            description="Notice 5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste."
        ),
    ]
    return ExercisesResponse(items=items)


@router.get("/games", response_model=GamesResponse)
def list_games():
    items = [
        Game(
            id="focus-1",
            title="Focus dots",
            description="Tap moving dots in order to gently train focus."
        ),
        Game(
            id="memory-1",
            title="Memory flip",
            description="Match calming image pairs."
        ),
    ]
    return GamesResponse(items=items)
