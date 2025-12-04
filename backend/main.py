import os
from uuid import uuid4
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router
from app.core.mongo import db
from app.core.security import hash_password

app = FastAPI(title="Mental Wellness Backend", version="1.0.0")

# Allow local dev origins; relax for now since this is demo/local.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "backend"}


app.include_router(api_router, prefix="/api")


@app.on_event("startup")
async def ensure_demo_user():
    """Create a demo user for local testing if none exists."""
    demo_email = os.getenv("DEMO_USER_EMAIL", "demo@example.com")
    demo_password = os.getenv("DEMO_USER_PASSWORD", "password123")

    existing = await db.users.find_one({"email": demo_email})
    if existing:
        return

    await db.users.insert_one(
        {
            "_id": str(uuid4()),
            "email": demo_email,
            "hashed_password": hash_password(demo_password),
        }
    )
