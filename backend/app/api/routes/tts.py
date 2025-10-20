"""TTS API endpoints"""
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.schemas import TTSRequest, TTSErrorResponse
from app.services import openai_service
from app.core.errors import TTSGenerationError
from app.core.constants import ERROR_INTERNAL

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post(
    "/tts",
    response_class=Response,
    responses={
        200: {
            "content": {"audio/opus": {}},
            "description": "Audio file in Opus format"
        },
        400: {"model": TTSErrorResponse},
        422: {"model": TTSErrorResponse},
        429: {"model": TTSErrorResponse},
        500: {"model": TTSErrorResponse},
    }
)
@limiter.limit("100/hour")
async def generate_speech_from_text(
    request: Request,
    tts_request: TTSRequest
):
    """
    Generate speech from text using OpenAI TTS API

    Args:
        request: FastAPI request object (used for rate limiting)
        tts_request: TTS request containing text, voice, and format options

    Returns:
        Audio file in the requested format

    Raises:
        HTTPException: For various error conditions (400, 422, 429, 500)
    """
    try:
        # Debug: Log request
        print(f"TTS Request received - Text length: {len(tts_request.text)}, Voice: {tts_request.voice}, Format: {tts_request.format}")
        # Generate speech using OpenAI service
        audio_data = openai_service.generate_speech(
            text=tts_request.text,
            voice=tts_request.voice,
            format=tts_request.format
        )

        # Determine media type based on format
        media_type_map = {
            "opus": "audio/opus",
            "mp3": "audio/mpeg",
            "aac": "audio/aac",
            "flac": "audio/flac"
        }
        media_type = media_type_map.get(tts_request.format, "audio/opus")

        return Response(
            content=audio_data,
            media_type=media_type
        )

    except TTSGenerationError as e:
        import traceback
        print(f"TTS Generation Error: {e.message}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=400 if "Invalid" in e.message else 500,
            detail={
                "error": e.error_code,
                "message": e.message
            }
        )
    except Exception as e:
        import traceback
        print(f"Unexpected TTS Error: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail={
                "error": ERROR_INTERNAL,
                "message": f"Internal server error: {str(e)}"
            }
        )
