from pydantic import BaseModel
from typing import List


class DaySummary(BaseModel):
    date: str
    avg_sentiment: float
    avg_stress: float


class DashboardSummary(BaseModel):
    user_id: str
    days: List[DaySummary]
    high_stress_days: int
