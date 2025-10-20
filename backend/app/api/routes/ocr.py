"""OCR API endpoints"""
from fastapi import APIRouter, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.schemas import OCRRequest, OCRResponse, OCRErrorResponse
from app.services.gemini_service import gemini_service
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
    Extract text from image(s) using Gemini API

    Supports both single image and multiple images.
    - For single image: provide 'image' field
    - For multiple images: provide 'images' field (max 10 images)

    Args:
        request: FastAPI request object (used for rate limiting)
        ocr_request: OCR request containing image data and options

    Returns:
        OCRResponse with extracted text, confidence, processing time, and page count

    Raises:
        HTTPException: For various error conditions (400, 429, 500)
    """
    try:
        # Check if multiple images or single image
        if ocr_request.images is not None:
            # Multiple images
            text, sentences, confidence, processing_time = gemini_service.extract_text_from_multiple_images(
                images_data=ocr_request.images,
                exclude_annotations=ocr_request.options.exclude_annotations,
                language=ocr_request.options.language,
                page_separator=ocr_request.options.page_separator
            )
            page_count = len(ocr_request.images)
        else:
            # Single image
            text, sentences, confidence, processing_time = gemini_service.extract_text(
                image_data=ocr_request.image,
                exclude_annotations=ocr_request.options.exclude_annotations,
                language=ocr_request.options.language
            )
            page_count = 1

        return OCRResponse(
            text=text,
            sentences=sentences,
            confidence=confidence,
            processing_time=processing_time,
            page_count=page_count
        )

    except OCRError as e:
        import traceback
        print(f"OCR Error: {e.message}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail={
                "error": e.error_code,
                "message": e.message
            }
        )
    except Exception as e:
        import traceback
        print(f"Unexpected Error: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail={
                "error": ERROR_INTERNAL,
                "message": f"Internal server error: {str(e)}"
            }
        )
