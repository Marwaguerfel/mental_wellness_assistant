from typing import List, Literal
from pydantic import BaseModel

ExerciseType = Literal["breathing", "grounding", "journaling"]


class Exercise(BaseModel):
    id: str
    title: str
    type: ExerciseType
    duration_minutes: int
    difficulty: str
    tags: List[str]
    description: str
    steps: List[str]


class ExerciseSearchResponse(BaseModel):
    items: List[Exercise]


class ExerciseRecommendResponse(BaseModel):
    items: List[Exercise]
