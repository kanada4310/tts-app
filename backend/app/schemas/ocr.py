"""OCR request and response schemas"""
from typing import Optional
from pydantic import BaseModel, Field


class OCROptions(BaseModel):
    """OCR processing options"""
    exclude_annotations: bool = Field(
        default=True,
        description="Exclude handwritten annotations and notes"
    )
    language: str = Field(
        default="en",
        description="Expected language of the text (en, ja, etc.)"
    )


class OCRRequest(BaseModel):
    """Request schema for OCR endpoint"""
    image: str = Field(
        ...,
        description="Base64 encoded image data"
    )
    options: Optional[OCROptions] = Field(
        default_factory=OCROptions,
        description="OCR processing options"
    )


class OCRResponse(BaseModel):
    """Response schema for OCR endpoint"""
    text: str = Field(
        ...,
        description="Extracted text from the image"
    )
    confidence: str = Field(
        ...,
        description="Confidence level: high, medium, low"
    )
    processing_time: float = Field(
        ...,
        description="Processing time in seconds"
    )


class OCRErrorResponse(BaseModel):
    """Error response schema for OCR endpoint"""
    error: str = Field(
        ...,
        description="Error code"
    )
    message: str = Field(
        ...,
        description="Human-readable error message"
    )
