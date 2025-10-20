"""OCR API endpoints"""
from fastapi import APIRouter

router = APIRouter()


@router.post("/ocr")
async def extract_text_from_image():
    """
    Extract text from image using Claude API

    TODO: Implement OCR logic
    """
    return {"message": "OCR endpoint - to be implemented"}
