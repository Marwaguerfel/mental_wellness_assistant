from pydantic import BaseModel, EmailStr


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class User(BaseModel):
    id: str
    email: EmailStr


class UserInDB(User):
    hashed_password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
