from pydantic import BaseModel
from typing import List


class Exercise(BaseModel):
    id: str
    title: str
    category: str
    description: str


class Game(BaseModel):
    id: str
    title: str
    description: str


class ExercisesResponse(BaseModel):
    items: List[Exercise]


class GamesResponse(BaseModel):
    items: List[Game]
