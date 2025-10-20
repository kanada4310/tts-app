"""Claude API service for OCR"""
import base64
import time
from typing import Tuple
from anthropic import Anthropic

from app.core.config import settings
from app.core.constants import (
    CLAUDE_MODEL,
    CLAUDE_MAX_TOKENS,
    ERROR_OCR_FAILED,
)
from app.core.errors import OCRError


class ClaudeService:
    """Service for interacting with Claude API for OCR"""

    def __init__(self):
        """Initialize Claude API client"""
        self.client = Anthropic(api_key=settings.anthropic_api_key)

    def extract_text(
        self,
        image_data: str,
        exclude_annotations: bool = True,
        language: str = "en"
    ) -> Tuple[str, str, float]:
        """
        Extract text from image using Claude's vision capabilities

        Args:
            image_data: Base64 encoded image data
            exclude_annotations: Whether to exclude handwritten annotations
            language: Expected language of the text

        Returns:
            Tuple of (extracted_text, confidence_level, processing_time)

        Raises:
            OCRError: If OCR processing fails
        """
        start_time = time.time()

        try:
            # Determine media type from base64 data
            media_type = self._get_media_type(image_data)

            # Clean base64 data (remove data URL prefix if present)
            clean_image_data = self._clean_base64_data(image_data)

            # Build prompt based on options
            prompt = self._build_prompt(exclude_annotations, language)

            # Call Claude API
            message = self.client.messages.create(
                model=CLAUDE_MODEL,
                max_tokens=CLAUDE_MAX_TOKENS,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": media_type,
                                    "data": clean_image_data,
                                },
                            },
                            {
                                "type": "text",
                                "text": prompt
                            }
                        ],
                    }
                ],
            )

            # Extract text from response
            extracted_text = message.content[0].text

            # Determine confidence based on response
            confidence = self._determine_confidence(message)

            processing_time = time.time() - start_time

            return extracted_text, confidence, processing_time

        except Exception as e:
            processing_time = time.time() - start_time
            raise OCRError(
                f"Claude OCR failed: {str(e)}",
                error_code=ERROR_OCR_FAILED
            ) from e

    def _get_media_type(self, image_data: str) -> str:
        """
        Determine media type from base64 data

        Args:
            image_data: Base64 encoded image data

        Returns:
            Media type string (e.g., 'image/jpeg', 'image/png')
        """
        if image_data.startswith("data:"):
            # Extract media type from data URL
            media_type = image_data.split(";")[0].replace("data:", "")
            return media_type
        # Default to JPEG
        return "image/jpeg"

    def _clean_base64_data(self, image_data: str) -> str:
        """
        Remove data URL prefix from base64 data if present

        Args:
            image_data: Base64 encoded image data (possibly with data URL prefix)

        Returns:
            Clean base64 data string
        """
        if image_data.startswith("data:"):
            # Remove data URL prefix (e.g., "data:image/jpeg;base64,")
            return image_data.split(",", 1)[1]
        return image_data

    def _build_prompt(self, exclude_annotations: bool, language: str) -> str:
        """
        Build OCR prompt based on options

        Args:
            exclude_annotations: Whether to exclude handwritten annotations
            language: Expected language of the text

        Returns:
            Prompt string for Claude
        """
        base_prompt = "Please extract all the text from this image."

        if exclude_annotations:
            base_prompt += (
                " Only extract the main printed text. "
                "Exclude any handwritten notes, annotations, or marginalia."
            )

        if language != "en":
            base_prompt += f" The text is in {language}."

        base_prompt += (
            " Return only the extracted text without any additional "
            "commentary or explanation."
        )

        return base_prompt

    def _determine_confidence(self, message) -> str:
        """
        Determine confidence level from Claude's response

        Args:
            message: Claude API response message

        Returns:
            Confidence level: 'high', 'medium', or 'low'
        """
        # This is a simplified confidence determination
        # In a real implementation, you might analyze stop_reason,
        # response length, or other factors

        if message.stop_reason == "end_turn":
            return "high"
        elif message.stop_reason == "max_tokens":
            return "medium"
        else:
            return "low"


# Global instance
claude_service = ClaudeService()
