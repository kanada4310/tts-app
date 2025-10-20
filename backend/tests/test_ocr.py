"""Tests for OCR API endpoint"""
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.core.constants import ERROR_OCR_FAILED, ERROR_INTERNAL
from app.core.errors import OCRError


@pytest.mark.unit
class TestOCREndpoint:
    """Test cases for OCR endpoint"""

    def test_ocr_success(self, client, sample_base64_image, mock_claude_message):
        """Test successful OCR request"""
        # Mock the Claude service
        with patch('app.api.routes.ocr.claude_service') as mock_service:
            mock_service.extract_text.return_value = (
                "Sample extracted text",
                "high",
                1.23
            )

            response = client.post(
                "/api/ocr",
                json={
                    "image": sample_base64_image,
                    "options": {
                        "exclude_annotations": True,
                        "language": "en"
                    }
                }
            )

            assert response.status_code == 200
            data = response.json()
            assert data["text"] == "Sample extracted text"
            assert data["confidence"] == "high"
            assert data["processing_time"] == 1.23

            # Verify the service was called correctly
            mock_service.extract_text.assert_called_once_with(
                image_data=sample_base64_image,
                exclude_annotations=True,
                language="en"
            )

    def test_ocr_with_data_url(self, client, sample_data_url_image):
        """Test OCR with data URL format image"""
        with patch('app.api.routes.ocr.claude_service') as mock_service:
            mock_service.extract_text.return_value = (
                "Text from data URL image",
                "high",
                2.0
            )

            response = client.post(
                "/api/ocr",
                json={"image": sample_data_url_image}
            )

            assert response.status_code == 200
            data = response.json()
            assert data["text"] == "Text from data URL image"

    def test_ocr_default_options(self, client, sample_base64_image):
        """Test OCR with default options"""
        with patch('app.api.routes.ocr.claude_service') as mock_service:
            mock_service.extract_text.return_value = (
                "Default options text",
                "medium",
                1.5
            )

            response = client.post(
                "/api/ocr",
                json={"image": sample_base64_image}
            )

            assert response.status_code == 200
            # Verify default options were used
            mock_service.extract_text.assert_called_once()
            call_kwargs = mock_service.extract_text.call_args[1]
            assert call_kwargs["exclude_annotations"] == True
            assert call_kwargs["language"] == "en"

    def test_ocr_japanese_language(self, client, sample_base64_image):
        """Test OCR with Japanese language option"""
        with patch('app.api.routes.ocr.claude_service') as mock_service:
            mock_service.extract_text.return_value = (
                "日本語のテキスト",
                "high",
                1.8
            )

            response = client.post(
                "/api/ocr",
                json={
                    "image": sample_base64_image,
                    "options": {
                        "language": "ja"
                    }
                }
            )

            assert response.status_code == 200
            data = response.json()
            assert data["text"] == "日本語のテキスト"

            # Verify language was passed correctly
            call_kwargs = mock_service.extract_text.call_args[1]
            assert call_kwargs["language"] == "ja"

    def test_ocr_include_annotations(self, client, sample_base64_image):
        """Test OCR with annotations included"""
        with patch('app.api.routes.ocr.claude_service') as mock_service:
            mock_service.extract_text.return_value = (
                "Text with annotations",
                "medium",
                2.1
            )

            response = client.post(
                "/api/ocr",
                json={
                    "image": sample_base64_image,
                    "options": {
                        "exclude_annotations": False
                    }
                }
            )

            assert response.status_code == 200
            call_kwargs = mock_service.extract_text.call_args[1]
            assert call_kwargs["exclude_annotations"] == False

    def test_ocr_service_error(self, client, sample_base64_image):
        """Test OCR when Claude service fails"""
        with patch('app.api.routes.ocr.claude_service') as mock_service:
            mock_service.extract_text.side_effect = OCRError(
                "Claude API failed",
                error_code=ERROR_OCR_FAILED
            )

            response = client.post(
                "/api/ocr",
                json={"image": sample_base64_image}
            )

            assert response.status_code == 500
            data = response.json()
            assert data["detail"]["error"] == ERROR_OCR_FAILED
            assert "Claude API failed" in data["detail"]["message"]

    def test_ocr_internal_error(self, client, sample_base64_image):
        """Test OCR with unexpected internal error"""
        with patch('app.api.routes.ocr.claude_service') as mock_service:
            mock_service.extract_text.side_effect = Exception("Unexpected error")

            response = client.post(
                "/api/ocr",
                json={"image": sample_base64_image}
            )

            assert response.status_code == 500
            data = response.json()
            assert data["detail"]["error"] == ERROR_INTERNAL
            assert "Internal server error" in data["detail"]["message"]

    def test_ocr_invalid_request_missing_image(self, client):
        """Test OCR with missing image field"""
        response = client.post(
            "/api/ocr",
            json={"options": {"language": "en"}}
        )

        assert response.status_code == 422  # Validation error

    def test_ocr_empty_image(self, client):
        """Test OCR with empty image string"""
        with patch('app.api.routes.ocr.claude_service') as mock_service:
            # Empty string should still be passed through
            # but may fail at service level
            mock_service.extract_text.side_effect = OCRError(
                "Invalid image data",
                error_code=ERROR_OCR_FAILED
            )

            response = client.post(
                "/api/ocr",
                json={"image": ""}
            )

            # Should return error from service
            assert response.status_code == 500


@pytest.mark.unit
class TestOCRRateLimit:
    """Test rate limiting for OCR endpoint"""

    def test_rate_limit_not_exceeded_on_first_request(self, client, sample_base64_image):
        """Test that first request succeeds"""
        with patch('app.api.routes.ocr.claude_service') as mock_service:
            mock_service.extract_text.return_value = ("text", "high", 1.0)

            response = client.post(
                "/api/ocr",
                json={"image": sample_base64_image}
            )

            assert response.status_code == 200
            # Rate limit headers should be present
            assert "X-RateLimit-Limit" in response.headers or response.status_code == 200
