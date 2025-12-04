from pydantic import BaseModel, EmailStr
from typing import Optional

class User(BaseModel):
    id: str
    email: EmailStr

class UserInDB(User):
    hashed_password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
