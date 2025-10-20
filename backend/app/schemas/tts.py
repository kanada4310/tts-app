"""TTS request and response schemas"""
from pydantic import BaseModel, Field


class TTSRequest(BaseModel):
    """Request schema for TTS endpoint"""
    text: str = Field(
        ...,
        min_length=1,
        max_length=100000,  # Increased for multiple pages support
        description="Text to convert to speech"
    )
    voice: str = Field(
        default="nova",
        description="Voice to use for TTS (alloy, echo, fable, onyx, nova, shimmer)"
    )
    format: str = Field(
        default="opus",
        description="Audio format (opus, mp3, aac, flac)"
    )


class TTSErrorResponse(BaseModel):
    """Error response schema for TTS endpoint"""
    error: str = Field(
        ...,
        description="Error code"
    )
    message: str = Field(
        ...,
        description="Human-readable error message"
    )
