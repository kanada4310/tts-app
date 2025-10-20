"""OCR request and response schemas"""
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator


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
    page_separator: str = Field(
        default="\n\n",
        description="Separator to use between pages when processing multiple images"
    )


class OCRRequest(BaseModel):
    """Request schema for OCR endpoint (supports both single and multiple images)"""
    image: Optional[str] = Field(
        default=None,
        description="Base64 encoded image data (for single image)"
    )
    images: Optional[List[str]] = Field(
        default=None,
        description="List of base64 encoded image data (for multiple images)"
    )
    options: Optional[OCROptions] = Field(
        default_factory=OCROptions,
        description="OCR processing options"
    )

    @field_validator('images')
    @classmethod
    def validate_images_length(cls, v):
        """Validate images list length"""
        if v is not None and len(v) > 10:
            raise ValueError("Maximum 10 images allowed")
        if v is not None and len(v) == 0:
            raise ValueError("At least 1 image required")
        return v

    def model_post_init(self, __context):
        """Validate that either image or images is provided"""
        if self.image is None and self.images is None:
            raise ValueError("Either 'image' or 'images' must be provided")
        if self.image is not None and self.images is not None:
            raise ValueError("Provide either 'image' or 'images', not both")


class OCRResponse(BaseModel):
    """Response schema for OCR endpoint"""
    text: str = Field(
        ...,
        description="Extracted text from the image(s)"
    )
    sentences: List[str] = Field(
        default_factory=list,
        description="List of sentences extracted from the text"
    )
    confidence: str = Field(
        ...,
        description="Confidence level: high, medium, low"
    )
    processing_time: float = Field(
        ...,
        description="Processing time in seconds"
    )
    page_count: int = Field(
        default=1,
        description="Number of pages processed"
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
