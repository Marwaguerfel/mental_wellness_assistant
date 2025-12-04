from pydantic import BaseModel
from typing import Dict

class AnalyzeRequest(BaseModel):
    text: str

class AnalyzeResponse(BaseModel):
    sentiment_label: str
    sentiment_probs: Dict[str, float]
    stress_label: str
    stress_probs: Dict[str, float]
    stress_score: float
    risk_flag: bool
