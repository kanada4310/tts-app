"""OpenAI TTS service"""
from openai import OpenAI
from io import BytesIO

from app.core.config import settings
from app.core.constants import (
    OPENAI_TTS_MODEL,
    OPENAI_TTS_SPEED,
    ERROR_TTS_FAILED,
)
from app.core.errors import TTSError, TTSGenerationError


class OpenAIService:
    """Service for interacting with OpenAI TTS API"""

    def __init__(self):
        """Initialize OpenAI API client"""
        self.client = OpenAI(api_key=settings.openai_api_key)

    def generate_speech(
        self,
        text: str,
        voice: str = "nova",
        format: str = "opus"
    ) -> bytes:
        """
        Generate speech from text using OpenAI TTS

        Args:
            text: Text to convert to speech
            voice: Voice to use (alloy, echo, fable, onyx, nova, shimmer)
            format: Audio format (opus, mp3, aac, flac)

        Returns:
            Audio data as bytes

        Raises:
            TTSGenerationError: If TTS generation fails
        """
        try:
            # Validate voice
            valid_voices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]
            if voice not in valid_voices:
                raise TTSGenerationError(
                    f"Invalid voice: {voice}. Must be one of {valid_voices}",
                    error_code=ERROR_TTS_FAILED
                )

            # Validate format
            valid_formats = ["opus", "mp3", "aac", "flac"]
            if format not in valid_formats:
                raise TTSGenerationError(
                    f"Invalid format: {format}. Must be one of {valid_formats}",
                    error_code=ERROR_TTS_FAILED
                )

            # Call OpenAI TTS API
            response = self.client.audio.speech.create(
                model=OPENAI_TTS_MODEL,
                voice=voice,
                input=text,
                response_format=format,
                speed=OPENAI_TTS_SPEED
            )

            # Read audio data
            audio_data = BytesIO()
            for chunk in response.iter_bytes():
                audio_data.write(chunk)

            return audio_data.getvalue()

        except TTSGenerationError:
            # Re-raise TTSGenerationError as-is
            raise
        except Exception as e:
            raise TTSGenerationError(
                f"OpenAI TTS failed: {str(e)}",
                error_code=ERROR_TTS_FAILED
            ) from e


# Global instance
openai_service = OpenAIService()
