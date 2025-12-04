import os
from datetime import datetime
from typing import Optional

import httpx
from fastapi import APIRouter, Depends
from dotenv import load_dotenv

from app.schemas.chat import (
    ChatMessageRequest,
    ChatMessageResponse,
    ChatHistoryResponse,
    ChatMessage,
)
from app.core.mongo import db
from app.core.security import get_current_user
from app.schemas.auth import User
from app.schemas.profile import UserProfile
from app.services.llm_client import generate_llm_reply

load_dotenv()
ML_SERVICE_URL = os.getenv("ML_SERVICE_URL", "http://127.0.0.1:8002")

router = APIRouter()


async def call_ml_service(text: str):
    url = f"{ML_SERVICE_URL}/analyze"
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json={"text": text})
        resp.raise_for_status()
        return resp.json()


async def get_profile_for_user(user_id: str) -> Optional[UserProfile]:
    doc = await db.users.find_one({"_id": user_id})
    if not doc:
        return None
    return UserProfile(
        id=str(doc.get("_id", "")),
        email=doc.get("email", ""),
        display_name=doc.get("display_name"),
        language=doc.get("language"),
        timezone=doc.get("timezone"),
        goal=doc.get("goal"),
        show_streaks=doc.get("show_streaks", True),
        created_at=doc.get("created_at"),
    )


@router.post("/message", response_model=ChatMessageResponse)
async def send_message(
    payload: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
):
    user_id = current_user.id
    user_msg = payload.message
    now = datetime.utcnow()

    await db.chat_messages.insert_one(
        {
            "user_id": user_id,
            "sender": "user",
            "text": user_msg,
            "created_at": now,
        }
    )

    ml_result = await call_ml_service(user_msg)

    profile = await get_profile_for_user(user_id)
    messages_count = await db.chat_messages.count_documents({"user_id": user_id})

    # Build system prompt with personalization and stress context
    display_name = profile.display_name if profile else None
    user_goal = profile.goal if profile else None
    language = profile.language if profile else "en"

    system_prompt = (
        "You are a mental wellness assistant.\n\n"
        f"User profile:\n- Name: {display_name or 'unknown'}\n"
        f"- Goal: {user_goal or 'not specified'}\n"
        f"- Language: {language}\n\n"
        f"Sentiment / stress:\n- Stress score (0-1): {ml_result['stress_score']}\n"
        f"- High risk: {ml_result['risk_flag']}\n\n"
        "Be warm, empathetic, short and practical. "
        "Do NOT give medical diagnoses. Encourage professional help for severe cases."
    )

    initial_personalization = ""
    if messages_count < 3:
        if display_name:
            initial_personalization += f"Greet them as {display_name}. "
        if user_goal:
            initial_personalization += f"Support their goal: '{user_goal}'. "

    if ml_result["risk_flag"]:
        initial_personalization += (
            "User is in high stress. Offer grounding exercise + ask softly if they want a quick 3D relaxation game."
        )
    elif ml_result["stress_score"] >= 0.4:
        initial_personalization += "User shows signs of stress. Suggest breathing or grounding."
    else:
        initial_personalization += "User is calm. Encourage progress toward their goal."

    system_prompt = system_prompt + "\n" + initial_personalization

    # Load short history (last 4 messages)
    cursor = (
        db.chat_messages.find({"user_id": user_id})
        .sort("created_at", -1)
        .limit(4)
    )
    last_msgs = list(reversed(await cursor.to_list(length=4)))
    history_messages = []
    for m in last_msgs:
        history_messages.append(
            {
                "role": "assistant" if m.get("sender") == "assistant" else "user",
                "content": m.get("text", ""),
            }
        )

    llm_messages = [
        {"role": "system", "content": system_prompt},
        *history_messages,
        {"role": "user", "content": user_msg},
    ]

    def simple_reply() -> str:
        # Fallback, mirrors earlier rule-based replies.
        if ml_result["risk_flag"]:
            return (
                "I'm really sorry that things feel so intense right now. "
                "You're not alone. Would you like to try a short grounding exercise?"
            )
        if ml_result["stress_label"] == "stressed":
            return (
                "It sounds like you're dealing with a lot. "
                "Thank you for sharing this with me. "
                "Can you tell me a bit more about what's making today difficult?"
            )
        return "Thanks for sharing. How are you feeling about this situation right now?"

    try:
        ai_reply = await generate_llm_reply(llm_messages)
    except Exception as e:
        # Log and fall back to a safe, local response
        print("Groq error:", e)
        ai_reply = simple_reply()

    await db.chat_messages.insert_one(
        {
            "user_id": user_id,
            "sender": "assistant",
            "text": ai_reply,
            "created_at": datetime.utcnow(),
            "sentiment_label": ml_result["sentiment_label"],
            "stress_label": ml_result["stress_label"],
            "stress_score": ml_result["stress_score"],
            "risk_flag": ml_result["risk_flag"],
        }
    )

    return ChatMessageResponse(
        reply=ai_reply,
        ai_reply=ai_reply,
        sentiment_label=ml_result["sentiment_label"],
        stress_label=ml_result["stress_label"],
        stress_score=ml_result["stress_score"],
        risk_flag=ml_result["risk_flag"],
    )


@router.get("/history/{user_id}", response_model=ChatHistoryResponse)
@router.get("/history/me", response_model=ChatHistoryResponse)
async def get_my_history(current_user: User = Depends(get_current_user)):
    user_id = current_user.id
    cursor = db.chat_messages.find({"user_id": user_id}).sort("created_at", 1)
    docs = await cursor.to_list(length=500)

    messages: list[ChatMessage] = []
    for d in docs:
        messages.append(
            ChatMessage(
                sender=d.get("sender", "user"),
                text=d.get("text", ""),
                timestamp=d.get("created_at"),
            )
        )

    return ChatHistoryResponse(user_id=user_id, messages=messages)
