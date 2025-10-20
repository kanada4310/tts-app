"""Gemini API service for OCR"""
import base64
import time
from typing import Tuple, List
import google.generativeai as genai

from app.core.config import settings
from app.core.errors import OCRError
from app.core.constants import ERROR_OCR_FAILED


class GeminiService:
    """Service for interacting with Gemini API for OCR"""

    def __init__(self):
        """Initialize Gemini API client"""
        genai.configure(api_key=settings.gemini_api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')

    def extract_text(
        self,
        image_data: str,
        exclude_annotations: bool = True,
        language: str = "en"
    ) -> Tuple[str, str, float]:
        """
        Extract text from image using Gemini's vision capabilities

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
            # Clean base64 data (remove data URL prefix if present)
            clean_image_data = self._clean_base64_data(image_data)

            # Decode base64 to bytes
            image_bytes = base64.b64decode(clean_image_data)

            # Build prompt based on options
            prompt = self._build_prompt(exclude_annotations, language)

            # Call Gemini API
            response = self.model.generate_content([
                {
                    'mime_type': self._get_media_type(image_data),
                    'data': image_bytes
                },
                prompt
            ])

            # Extract text from response
            extracted_text = response.text

            # Gemini doesn't provide explicit confidence scores
            # We'll use "high" for successful responses
            confidence = "high"

            processing_time = time.time() - start_time

            return extracted_text, confidence, processing_time

        except Exception as e:
            processing_time = time.time() - start_time
            raise OCRError(
                f"Gemini OCR failed: {str(e)}",
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
            Prompt string for Gemini
        """
        base_prompt = "Please extract all the text from this image."

        if exclude_annotations:
            base_prompt += (
                " Only extract the main printed text. "
                "Exclude any handwritten notes, annotations, or marginalia."
            )

        if language != "en" and language != "auto":
            base_prompt += f" The text is in {language}."

        base_prompt += (
            " Return only the extracted text without any additional "
            "commentary or explanation."
        )

        return base_prompt

    def extract_text_from_multiple_images(
        self,
        images_data: List[str],
        exclude_annotations: bool = True,
        language: str = "en",
        page_separator: str = "\n\n"
    ) -> Tuple[str, str, float]:
        """
        Extract text from multiple images using Gemini's vision capabilities

        Args:
            images_data: List of base64 encoded image data
            exclude_annotations: Whether to exclude handwritten annotations
            language: Expected language of the text
            page_separator: Separator to use between pages

        Returns:
            Tuple of (extracted_text, confidence_level, processing_time)

        Raises:
            OCRError: If OCR processing fails
        """
        start_time = time.time()

        try:
            extracted_texts = []

            # Process each image sequentially
            for i, image_data in enumerate(images_data):
                try:
                    # Extract text from single image
                    text, _, _ = self.extract_text(
                        image_data=image_data,
                        exclude_annotations=exclude_annotations,
                        language=language
                    )
                    extracted_texts.append(text)
                except OCRError as e:
                    # If one page fails, include error message
                    extracted_texts.append(f"[Error processing page {i + 1}: {str(e)}]")

            # Combine all texts with separator
            combined_text = page_separator.join(extracted_texts)

            # Confidence is "high" if at least one page succeeded
            confidence = "high" if any(
                not text.startswith("[Error") for text in extracted_texts
            ) else "low"

            processing_time = time.time() - start_time

            return combined_text, confidence, processing_time

        except Exception as e:
            processing_time = time.time() - start_time
            raise OCRError(
                f"Gemini OCR failed for multiple images: {str(e)}",
                error_code=ERROR_OCR_FAILED
            ) from e


# Global instance
gemini_service = GeminiService()
