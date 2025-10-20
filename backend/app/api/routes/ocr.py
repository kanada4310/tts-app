"""OCR API endpoints"""
from fastapi import APIRouter, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.schemas import OCRRequest, OCRResponse, OCRErrorResponse
from app.services import claude_service
from app.core.errors import OCRError
from app.core.constants import ERROR_INTERNAL

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post(
    "/ocr",
    response_model=OCRResponse,
    responses={
        400: {"model": OCRErrorResponse},
        429: {"model": OCRErrorResponse},
        500: {"model": OCRErrorResponse},
    }
)
@limiter.limit("100/hour")
async def extract_text_from_image(
    request: Request,
    ocr_request: OCRRequest
):
    """
    Extract text from image using Claude API

    Args:
        request: FastAPI request object (used for rate limiting)
        ocr_request: OCR request containing image data and options

    Returns:
        OCRResponse with extracted text, confidence, and processing time

    Raises:
        HTTPException: For various error conditions (400, 429, 500)
    """
    try:
        # Extract text using Claude service
        text, confidence, processing_time = claude_service.extract_text(
            image_data=ocr_request.image,
            exclude_annotations=ocr_request.options.exclude_annotations,
            language=ocr_request.options.language
        )

        return OCRResponse(
            text=text,
            confidence=confidence,
            processing_time=processing_time
        )

    except OCRError as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": e.error_code,
                "message": e.message
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": ERROR_INTERNAL,
                "message": f"Internal server error: {str(e)}"
            }
        )
