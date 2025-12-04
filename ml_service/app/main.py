import os
from pathlib import Path
from fastapi import FastAPI
from app.schemas import AnalyzeRequest, AnalyzeResponse
import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from app.emotion_face import router as emotion_face_router

app = FastAPI(title="ML Service - With Real BERT Models")

# Build absolute paths (as POSIX) to keep huggingface_hub happy on Windows
BASE_DIR = Path(__file__).resolve().parent            # /ml_service/app
ROOT_DIR = BASE_DIR.parent                            # /ml_service
MODELS_DIR = ROOT_DIR / "models"                      # /ml_service/models

SENT_MODEL_PATH = (MODELS_DIR / "bert-sentiment").as_posix()
STRESS_MODEL_PATH = (MODELS_DIR / "bert_stress").as_posix()

# Classes
sentiment_classes = ["very_negative", "negative", "neutral", "positive"]
stress_classes = ["not_stressed", "stressed"]

# Device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load models
tokenizer_sent = AutoTokenizer.from_pretrained(SENT_MODEL_PATH)
model_sent = AutoModelForSequenceClassification.from_pretrained(SENT_MODEL_PATH).to(device)

tokenizer_stress = AutoTokenizer.from_pretrained(STRESS_MODEL_PATH)
model_stress = AutoModelForSequenceClassification.from_pretrained(STRESS_MODEL_PATH).to(device)

def predict_sentiment(text: str):
    inputs = tokenizer_sent(text, return_tensors="pt", truncation=True, max_length=128).to(device)
    with torch.no_grad():
        outputs = model_sent(**inputs)
    probs = F.softmax(outputs.logits, dim=-1).cpu().numpy().flatten()
    idx = int(probs.argmax())
    return sentiment_classes[idx], {sentiment_classes[i]: float(probs[i]) for i in range(len(probs))}

def predict_stress(text: str):
    inputs = tokenizer_stress(text, return_tensors="pt", truncation=True, max_length=128).to(device)
    with torch.no_grad():
        outputs = model_stress(**inputs)
    probs = F.softmax(outputs.logits, dim=-1).cpu().numpy().flatten()
    idx = int(probs.argmax())
    stress_score = float(probs[stress_classes.index("stressed")])
    return (
        stress_classes[idx],
        {stress_classes[i]: float(probs[i]) for i in range(len(probs))},
        stress_score,
        stress_score > 0.8,
    )

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest):
    sent_label, sent_probs = predict_sentiment(req.text)
    stress_label, stress_probs, stress_score, risk_flag = predict_stress(req.text)

    return AnalyzeResponse(
        sentiment_label=sent_label,
        sentiment_probs=sent_probs,
        stress_label=stress_label,
        stress_probs=stress_probs,
        stress_score=stress_score,
        risk_flag=risk_flag,
    )


# Image emotion endpoint
app.include_router(emotion_face_router, prefix="/api")
