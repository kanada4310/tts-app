"""Pydantic schemas"""
from .ocr import OCRRequest, OCRResponse, OCROptions, OCRErrorResponse
from .tts import TTSRequest, TTSErrorResponse, TTSResponse, SentenceTiming

__all__ = [
    "OCRRequest",
    "OCRResponse",
    "OCROptions",
    "OCRErrorResponse",
    "TTSRequest",
    "TTSErrorResponse",
    "TTSResponse",
    "SentenceTiming",
]
