from io import BytesIO

import torch
from fastapi import APIRouter, File, HTTPException, UploadFile
from PIL import Image
from transformers import AutoImageProcessor, AutoModelForImageClassification

router = APIRouter()

MODEL_ID = "dima806/facial_emotions_image_detection"
processor = AutoImageProcessor.from_pretrained(MODEL_ID)
model = AutoModelForImageClassification.from_pretrained(MODEL_ID)


@router.post("/emotion/face")
async def detect_face_emotion(file: UploadFile = File(...)):
    """
    Estimate facial emotion from an uploaded image.
    """
    try:
        content = await file.read()
        image = Image.open(BytesIO(content)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    inputs = processor(images=image, return_tensors="pt")
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        probs = torch.softmax(logits, dim=-1)[0]

    pred_idx = int(torch.argmax(probs).item())
    label = model.config.id2label[pred_idx]
    scores = {model.config.id2label[i]: float(probs[i].item()) for i in range(probs.shape[0])}

    return {"emotion": label, "scores": scores}
