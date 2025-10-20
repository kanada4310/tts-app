"""TTS API endpoints"""
from fastapi import APIRouter

router = APIRouter()


@router.post("/tts")
async def generate_speech_from_text():
    """
    Generate speech from text using OpenAI TTS API

    TODO: Implement TTS logic
    """
    return {"message": "TTS endpoint - to be implemented"}
