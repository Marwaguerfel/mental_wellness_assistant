from uuid import uuid4
from fastapi import APIRouter, HTTPException, status
from app.models.user import UserInDB, UserCreate
from app.core.mongo import db
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter()

@router.post("/signup")
async def signup(payload: UserCreate):
    # check if user exists
    existing = await db.users.find_one({"email": payload.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists"
        )

    user_id = str(uuid4())

    new_user = {
        "_id": user_id,
        "email": payload.email,
        "hashed_password": hash_password(payload.password),
    }

    await db.users.insert_one(new_user)

    token = create_access_token({"sub": user_id, "email": payload.email})

    return {"access_token": token, "token_type": "bearer"}


@router.post("/login")
async def login(payload: UserCreate):
    user = await db.users.find_one({"email": payload.email})

    if not user or not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token = create_access_token({"sub": user["_id"], "email": user["email"]})

    return {"access_token": token, "token_type": "bearer"}
