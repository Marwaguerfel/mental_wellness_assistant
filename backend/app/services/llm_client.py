import os
from typing import List, Dict, Any

import httpx

# alias for chat message structure
ChatMessage = Dict[str, str]


async def generate_llm_reply(messages: List[ChatMessage]) -> str:
    """
    Call Groq's OpenAI-compatible ChatCompletion API.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is missing in environment variables")

    model = os.getenv("GROQ_MODEL_ID", "llama-3.1-70b-versatile")

    url = "https://api.groq.com/openai/v1/chat/completions"
    payload: dict[str, Any] = {
        "model": model,
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": 512,
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=40) as client:
        resp = await client.post(url, json=payload, headers=headers)
        resp.raise_for_status()
        data = resp.json()

    return data["choices"][0]["message"]["content"]
