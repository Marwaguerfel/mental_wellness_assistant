from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserProfile(BaseModel):
    id: str
    email: EmailStr
    display_name: Optional[str] = None
    language: Optional[str] = None  # e.g. "en", "fr", "ar", "de"
    timezone: Optional[str] = None  # e.g. "Europe/Berlin"
    goal: Optional[str] = None  # user's wellness goal
    show_streaks: bool = True
    created_at: Optional[datetime] = None


class UpdateUserProfile(BaseModel):
    display_name: Optional[str] = None
    language: Optional[str] = None
    timezone: Optional[str] = None
    goal: Optional[str] = None
    show_streaks: Optional[bool] = None
