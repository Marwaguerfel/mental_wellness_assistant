from fastapi import APIRouter, Depends, HTTPException

from app.core.mongo import db
from app.core.security import get_current_user
from app.schemas.auth import User
from app.schemas.profile import UpdateUserProfile, UserProfile

router = APIRouter()


def doc_to_profile(doc) -> UserProfile:
    return UserProfile(
        id=str(doc["_id"]),
        email=doc["email"],
        display_name=doc.get("display_name"),
        language=doc.get("language"),
        timezone=doc.get("timezone"),
        goal=doc.get("goal"),
        show_streaks=doc.get("show_streaks", True),
        created_at=doc.get("created_at"),
    )


@router.get("/me", response_model=UserProfile)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    doc = await db.users.find_one({"_id": current_user.id})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    return doc_to_profile(doc)


@router.put("/me", response_model=UserProfile)
async def update_my_profile(
    payload: UpdateUserProfile, current_user: User = Depends(get_current_user)
):
    update_fields = {
        field: value
        for field, value in payload.model_dump(exclude_unset=True).items()
    }

    if update_fields:
        await db.users.update_one(
            {"_id": current_user.id},
            {"$set": update_fields},
        )

    updated = await db.users.find_one({"_id": current_user.id})
    if not updated:
        raise HTTPException(status_code=404, detail="User not found after update")

    return doc_to_profile(updated)
