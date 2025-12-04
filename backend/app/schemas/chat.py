from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class ChatMessageRequest(BaseModel):
    message: str


class ChatMessage(BaseModel):
    sender: str  # "user" or "assistant"
    text: str
    timestamp: Optional[datetime] = None  # NEW (optional)


class ChatMessageResponse(BaseModel):
    reply: str
    ai_reply: str | None = None
    sentiment_label: str
    stress_label: str
    stress_score: float
    risk_flag: bool


class ChatHistoryResponse(BaseModel):
    user_id: str
    messages: List[ChatMessage]
