"""TTS API endpoints"""
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response, JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.schemas import TTSRequest, TTSErrorResponse, TTSResponse
from app.services import openai_service
from app.core.errors import TTSGenerationError
from app.core.constants import ERROR_INTERNAL
import base64

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

        # Standard generation (always returns binary audio)
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


@router.post(
    "/tts-with-timings",
    response_model=None,
    responses={
        200: {
            "content": {"application/json": {}},
            "description": "JSON response with audio data and sentence timings"
        },
        400: {"model": TTSErrorResponse},
        422: {"model": TTSErrorResponse},
        429: {"model": TTSErrorResponse},
        500: {"model": TTSErrorResponse},
    }
)
@limiter.limit("100/hour")
async def generate_speech_with_timings(
    request: Request,
    tts_request: TTSRequest
):
    """
    Generate speech with sentence-level timing information

    Args:
        request: FastAPI request object (used for rate limiting)
        tts_request: TTS request containing text, sentences, voice, and format options

    Returns:
        JSON with base64-encoded audio data and sentence timings

    Raises:
        HTTPException: For various error conditions (400, 422, 429, 500)
    """
    try:
        # Validate that sentences are provided
        if not tts_request.sentences or len(tts_request.sentences) == 0:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "MISSING_SENTENCES",
                    "message": "Sentences array is required for this endpoint"
                }
            )

        print(f"TTS with timings - Sentences: {len(tts_request.sentences)}, Voice: {tts_request.voice}, Format: {tts_request.format}")

        # Generate speech with timings
        audio_data, sentence_timings, total_duration = openai_service.generate_speech_with_timings(
            sentences=tts_request.sentences,
            voice=tts_request.voice,
            format=tts_request.format
        )

        # Return JSON response with base64-encoded audio and timings
        return JSONResponse(content={
            "audio_data": base64.b64encode(audio_data).decode('utf-8'),
            "sentence_timings": [
                {
                    "text": timing.text,
                    "start_time": timing.start_time,
                    "end_time": timing.end_time,
                    "duration": timing.duration
                }
                for timing in sentence_timings
            ],
            "total_duration": total_duration,
            "format": tts_request.format
        })

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
    except HTTPException:
        # Re-raise HTTPException as-is
        raise
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


@router.post(
    "/tts-with-timings-separated",
    response_model=None,
    responses={
        200: {
            "content": {"application/json": {}},
            "description": "JSON with separated audio segments"
        },
        400: {"model": TTSErrorResponse},
        422: {"model": TTSErrorResponse},
        429: {"model": TTSErrorResponse},
        500: {"model": TTSErrorResponse},
    }
)
@limiter.limit("100/hour")
async def generate_speech_separated(
    request: Request,
    tts_request: TTSRequest
):
    """
    Generate speech with separated audio files per sentence

    This endpoint returns an array of audio segments (one per sentence),
    allowing for precise control over individual sentence playback.

    Returns:
        JSON with array of audio segments (each sentence = separate audio file)
    """
    try:
        # Validate sentences
        if not tts_request.sentences or len(tts_request.sentences) == 0:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "MISSING_SENTENCES",
                    "message": "Sentences array is required for this endpoint"
                }
            )

        print(f"TTS separated - Sentences: {len(tts_request.sentences)}, Voice: {tts_request.voice}, Format: {tts_request.format}")

        # Generate separated audio files
        audio_segments, total_duration = openai_service.generate_speech_separated(
            sentences=tts_request.sentences,
            voice=tts_request.voice,
            format=tts_request.format
        )

        # Return JSON response
        return JSONResponse(content={
            "audio_segments": audio_segments,
            "total_duration": total_duration,
            "format": tts_request.format
        })

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
    except HTTPException:
        raise
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
