"""Gemini API service for OCR"""
import base64
import json
import time
from typing import Tuple, List, Dict, Any
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
    ) -> Tuple[str, List[str], str, float]:
        """
        Extract text from image using Gemini's vision capabilities

        Args:
            image_data: Base64 encoded image data
            exclude_annotations: Whether to exclude handwritten annotations
            language: Expected language of the text

        Returns:
            Tuple of (extracted_text, sentences, confidence_level, processing_time)

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

            # Parse JSON response
            response_text = response.text.strip()

            # Remove markdown code blocks if present
            if response_text.startswith("```json"):
                response_text = response_text[7:]  # Remove ```json
            if response_text.startswith("```"):
                response_text = response_text[3:]  # Remove ```
            if response_text.endswith("```"):
                response_text = response_text[:-3]  # Remove trailing ```

            response_text = response_text.strip()

            # Parse JSON
            parsed_response = json.loads(response_text)

            # Extract sentences and full text
            sentences = parsed_response.get("sentences", [])
            extracted_text = " ".join(sentences)

            # Gemini doesn't provide explicit confidence scores
            # We'll use "high" for successful responses
            confidence = "high"

            processing_time = time.time() - start_time

            return extracted_text, sentences, confidence, processing_time

        except json.JSONDecodeError as e:
            # Fallback: if JSON parsing fails, return response as plain text
            processing_time = time.time() - start_time
            extracted_text = response.text if 'response' in locals() else ""
            return extracted_text, [extracted_text], "medium", processing_time

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
        base_prompt = """Extract the text from this image and return it as a JSON object with the following structure:

{
  "sentences": ["sentence1", "sentence2", "sentence3", ...]
}

Requirements:
1. EXCLUDE: page numbers, headers, footers, captions, figure labels, table of contents
"""

        if exclude_annotations:
            base_prompt += "2. EXCLUDE: handwritten notes, annotations, marginalia\n"
            base_prompt += "3. Extract ONLY the main body text (printed text)\n"
        else:
            base_prompt += "2. Extract all text including handwritten notes\n"

        base_prompt += """4. Split text into sentences at proper boundaries:
   - Split at: periods (.), exclamation marks (!), question marks (?)
   - DO NOT split at: commas (,), semicolons (;), colons (:)
   - DO NOT split at abbreviations: Mr., Dr., Mrs., Ms., Prof., Sr., Jr., vs., etc., e.g., i.e., U.S.A., etc.
5. Each sentence should be a complete, standalone sentence
6. Preserve the original sentence structure and punctuation
7. Remove extra whitespace but keep sentence spacing
"""

        if language != "en" and language != "auto":
            base_prompt += f"8. The text is in {language}\n"

        base_prompt += """
Return ONLY valid JSON. Do not include any commentary, explanation, or markdown formatting.
"""

        return base_prompt

    def extract_text_from_multiple_images(
        self,
        images_data: List[str],
        exclude_annotations: bool = True,
        language: str = "en",
        page_separator: str = "\n\n"
    ) -> Tuple[str, List[str], str, float]:
        """
        Extract text from multiple images using Gemini's vision capabilities

        Args:
            images_data: List of base64 encoded image data
            exclude_annotations: Whether to exclude handwritten annotations
            language: Expected language of the text
            page_separator: Separator to use between pages

        Returns:
            Tuple of (extracted_text, sentences, confidence_level, processing_time)

        Raises:
            OCRError: If OCR processing fails
        """
        start_time = time.time()

        try:
            all_sentences = []
            extracted_texts = []

            # Process each image sequentially
            for i, image_data in enumerate(images_data):
                try:
                    # Extract text from single image
                    text, sentences, _, _ = self.extract_text(
                        image_data=image_data,
                        exclude_annotations=exclude_annotations,
                        language=language
                    )
                    extracted_texts.append(text)
                    all_sentences.extend(sentences)
                except OCRError as e:
                    # If one page fails, include error message
                    error_msg = f"[Error processing page {i + 1}: {str(e)}]"
                    extracted_texts.append(error_msg)
                    all_sentences.append(error_msg)

            # Combine all texts with separator
            combined_text = page_separator.join(extracted_texts)

            # Confidence is "high" if at least one page succeeded
            confidence = "high" if any(
                not text.startswith("[Error") for text in extracted_texts
            ) else "low"

            processing_time = time.time() - start_time

            return combined_text, all_sentences, confidence, processing_time

        except Exception as e:
            processing_time = time.time() - start_time
            raise OCRError(
                f"Gemini OCR failed for multiple images: {str(e)}",
                error_code=ERROR_OCR_FAILED
            ) from e


# Global instance
gemini_service = GeminiService()
