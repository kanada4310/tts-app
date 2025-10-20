"""TTS request and response schemas"""
from typing import List, Optional
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
    sentences: Optional[List[str]] = Field(
        default=None,
        description="Optional list of sentences for precise timing (from OCR)"
    )


class SentenceTiming(BaseModel):
    """Timing information for a single sentence"""
    text: str = Field(..., description="Sentence text")
    start_time: float = Field(..., description="Start time in seconds")
    end_time: float = Field(..., description="End time in seconds")
    duration: float = Field(..., description="Duration in seconds")


class TTSResponse(BaseModel):
    """Response schema for TTS with sentence timings"""
    sentence_timings: List[SentenceTiming] = Field(
        default_factory=list,
        description="Timing information for each sentence"
    )
    total_duration: float = Field(
        ...,
        description="Total audio duration in seconds"
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
