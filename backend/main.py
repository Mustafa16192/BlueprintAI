import os
import pdfplumber
import requests
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel

# ─────────────────────────────────────────
# 1. Load environment variables
# ─────────────────────────────────────────
load_dotenv()  # expects .env in the same folder

FIREWORKS_API_KEY = os.getenv("FIREWORKS_API_KEY")
FIREWORKS_MODEL_ID = os.getenv("FIREWORKS_MODEL_ID")  # e.g. accounts/fireworks/models/llama-v3-8b-instruct

if not FIREWORKS_API_KEY or not FIREWORKS_MODEL_ID:
    raise RuntimeError(
        "Both FIREWORKS_API_KEY and FIREWORKS_MODEL_ID "
        "must be set in backend/.env"
    )

FIREWORKS_ENDPOINT = "https://api.fireworks.ai/inference/v1/completions"

# ─────────────────────────────────────────
# 2. FastAPI app & CORS
# ─────────────────────────────────────────
app = FastAPI(title="Startup Deck Reviewer – Fireworks Edition")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # adjust for prod
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────
# 3. Helper: extract slide text
# ─────────────────────────────────────────

def extract_slides(pdf_path: str) -> str:
    """Return slide-delimited text from a PDF."""
    chunks = []
    with pdfplumber.open(pdf_path) as pdf:
        for idx, page in enumerate(pdf.pages):
            page_text = page.extract_text() or "[No text found]"
            chunks.append(f"\n\n--- Slide {idx + 1} ---\n{page_text}")
    return "".join(chunks).strip()

# ─────────────────────────────────────────
# 4. POST /upload endpoint
# ─────────────────────────────────────────

@app.post("/upload")
async def upload_pitch_deck(file: UploadFile = File(...)):
    try:
        # 4-a  Save upload
        os.makedirs("uploads", exist_ok=True)
        local_path = f"uploads/{file.filename}"
        with open(local_path, "wb") as f:
            f.write(await file.read())

        # 4-b  PDF → text
        slide_text = extract_slides(local_path)

        # 4-c  Build prompt
        prompt = (
            "You are a seasoned VC deck reviewer.\n"
            "For each slide below, give:\n"
            "✅ Strengths\n⚠️ Weaknesses\n💡 Improvements\n"
            f"{slide_text}"
        )

        # 4-d  Fireworks API call
        resp = requests.post(
            FIREWORKS_ENDPOINT,
            headers={
                "Authorization": f"Bearer {FIREWORKS_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": FIREWORKS_MODEL_ID,
                "prompt": prompt,
                "max_tokens": 1024,
                "temperature": 0.7,
            },
            timeout=60,
        )

        if resp.status_code != 200:
            raise HTTPException(
                status_code=500,
                detail=f"Fireworks error {resp.status_code}: {resp.text}",
            )

        review = resp.json()["choices"][0]["text"].strip()
        return {"review": review}

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

# ─────────────────────────────────────────
# 5. Generic AI generation endpoint for consulting tools
# ─────────────────────────────────────────

class GenerationRequest(BaseModel):
    purpose: str  # e.g., "Executive Summary", "SWOT Analysis", etc.
    context: str  # user-provided notes, data, or problem description
    audience: str | None = None
    tone: str | None = None
    format: str | None = None
    max_tokens: int | None = 800
    temperature: float | None = 0.7


@app.post("/generate")
async def generate(req: GenerationRequest):
    try:
        # Build a versatile consulting assistant prompt
        meta_parts = []
        if req.audience:
            meta_parts.append(f"Audience: {req.audience}")
        if req.tone:
            meta_parts.append(f"Tone: {req.tone}")
        if req.format:
            meta_parts.append(f"Output Format: {req.format}")
        meta = ("\n" + "\n".join(meta_parts)) if meta_parts else ""

        prompt = (
            "You are a senior management consulting assistant.\n"
            "Follow best practices (MECE, hypothesis-driven, concise, structured).\n"
            f"Task/Purpose: {req.purpose}.{meta}\n"
            "Context/Input:\n"
            f"{req.context}\n\n"
            "Return a clear, well-structured answer with headings and bullet points where appropriate."
        )

        resp = requests.post(
            FIREWORKS_ENDPOINT,
            headers={
                "Authorization": f"Bearer {FIREWORKS_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": FIREWORKS_MODEL_ID,
                "prompt": prompt,
                "max_tokens": req.max_tokens or 800,
                "temperature": req.temperature or 0.7,
            },
            timeout=60,
        )

        if resp.status_code != 200:
            raise HTTPException(
                status_code=500,
                detail=f"Fireworks error {resp.status_code}: {resp.text}",
            )

        text = resp.json()["choices"][0]["text"].strip()
        return {"text": text}

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
