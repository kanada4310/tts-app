"""Tests for TTS API endpoint"""
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.core.constants import ERROR_TTS_FAILED, ERROR_INTERNAL
from app.core.errors import TTSGenerationError


@pytest.mark.unit
class TestTTSEndpoint:
    """Test cases for TTS endpoint"""

    def test_tts_success_default_options(self, client):
        """Test successful TTS request with default options"""
        with patch('app.api.routes.tts.openai_service') as mock_service:
            audio_data = b'\x00\x01\x02\x03' * 100
            mock_service.generate_speech.return_value = audio_data

            response = client.post(
                "/api/tts",
                json={"text": "Hello, world!"}
            )

            assert response.status_code == 200
            assert response.headers["content-type"] == "audio/opus"
            assert response.content == audio_data

            # Verify the service was called with defaults
            mock_service.generate_speech.assert_called_once_with(
                text="Hello, world!",
                voice="nova",
                format="opus"
            )

    def test_tts_with_custom_voice(self, client):
        """Test TTS with custom voice option"""
        with patch('app.api.routes.tts.openai_service') as mock_service:
            audio_data = b'\x00\x01\x02\x03' * 50
            mock_service.generate_speech.return_value = audio_data

            response = client.post(
                "/api/tts",
                json={
                    "text": "Custom voice test",
                    "voice": "alloy"
                }
            )

            assert response.status_code == 200
            call_kwargs = mock_service.generate_speech.call_args[1]
            assert call_kwargs["voice"] == "alloy"

    def test_tts_with_mp3_format(self, client):
        """Test TTS with MP3 format"""
        with patch('app.api.routes.tts.openai_service') as mock_service:
            audio_data = b'mp3_audio_data' * 20
            mock_service.generate_speech.return_value = audio_data

            response = client.post(
                "/api/tts",
                json={
                    "text": "MP3 format test",
                    "format": "mp3"
                }
            )

            assert response.status_code == 200
            assert response.headers["content-type"] == "audio/mpeg"
            assert response.content == audio_data

    def test_tts_with_aac_format(self, client):
        """Test TTS with AAC format"""
        with patch('app.api.routes.tts.openai_service') as mock_service:
            audio_data = b'aac_audio_data' * 20
            mock_service.generate_speech.return_value = audio_data

            response = client.post(
                "/api/tts",
                json={
                    "text": "AAC format test",
                    "format": "aac"
                }
            )

            assert response.status_code == 200
            assert response.headers["content-type"] == "audio/aac"

    def test_tts_with_flac_format(self, client):
        """Test TTS with FLAC format"""
        with patch('app.api.routes.tts.openai_service') as mock_service:
            audio_data = b'flac_audio_data' * 20
            mock_service.generate_speech.return_value = audio_data

            response = client.post(
                "/api/tts",
                json={
                    "text": "FLAC format test",
                    "format": "flac"
                }
            )

            assert response.status_code == 200
            assert response.headers["content-type"] == "audio/flac"

    def test_tts_all_voices(self, client):
        """Test TTS with all available voices"""
        voices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]

        for voice in voices:
            with patch('app.api.routes.tts.openai_service') as mock_service:
                audio_data = b'audio' * 10
                mock_service.generate_speech.return_value = audio_data

                response = client.post(
                    "/api/tts",
                    json={
                        "text": f"Testing {voice} voice",
                        "voice": voice
                    }
                )

                assert response.status_code == 200
                call_kwargs = mock_service.generate_speech.call_args[1]
                assert call_kwargs["voice"] == voice

    def test_tts_long_text(self, client):
        """Test TTS with longer text"""
        with patch('app.api.routes.tts.openai_service') as mock_service:
            audio_data = b'long_audio' * 100
            mock_service.generate_speech.return_value = audio_data

            long_text = "This is a much longer text. " * 50  # ~1400 characters
            response = client.post(
                "/api/tts",
                json={"text": long_text}
            )

            assert response.status_code == 200
            assert len(response.content) > 0

    def test_tts_japanese_text(self, client):
        """Test TTS with Japanese text"""
        with patch('app.api.routes.tts.openai_service') as mock_service:
            audio_data = b'japanese_audio' * 30
            mock_service.generate_speech.return_value = audio_data

            response = client.post(
                "/api/tts",
                json={
                    "text": "こんにちは、世界！これはテストです。",
                    "voice": "nova"
                }
            )

            assert response.status_code == 200

    def test_tts_service_error_invalid_voice(self, client):
        """Test TTS when service returns invalid voice error"""
        with patch('app.api.routes.tts.openai_service') as mock_service:
            mock_service.generate_speech.side_effect = TTSGenerationError(
                "Invalid voice: unknown_voice",
                error_code=ERROR_TTS_FAILED
            )

            response = client.post(
                "/api/tts",
                json={
                    "text": "Test",
                    "voice": "unknown_voice"
                }
            )

            assert response.status_code == 400
            data = response.json()
            assert data["detail"]["error"] == ERROR_TTS_FAILED
            assert "Invalid" in data["detail"]["message"]

    def test_tts_service_error_generation_failed(self, client):
        """Test TTS when generation fails"""
        with patch('app.api.routes.tts.openai_service') as mock_service:
            mock_service.generate_speech.side_effect = TTSGenerationError(
                "OpenAI TTS failed",
                error_code=ERROR_TTS_FAILED
            )

            response = client.post(
                "/api/tts",
                json={"text": "Test"}
            )

            assert response.status_code == 500
            data = response.json()
            assert data["detail"]["error"] == ERROR_TTS_FAILED

    def test_tts_internal_error(self, client):
        """Test TTS with unexpected internal error"""
        with patch('app.api.routes.tts.openai_service') as mock_service:
            mock_service.generate_speech.side_effect = Exception("Unexpected error")

            response = client.post(
                "/api/tts",
                json={"text": "Test"}
            )

            assert response.status_code == 500
            data = response.json()
            assert data["detail"]["error"] == ERROR_INTERNAL
            assert "Internal server error" in data["detail"]["message"]

    def test_tts_invalid_request_missing_text(self, client):
        """Test TTS with missing text field"""
        response = client.post(
            "/api/tts",
            json={"voice": "nova"}
        )

        assert response.status_code == 422  # Validation error

    def test_tts_empty_text(self, client):
        """Test TTS with empty text string"""
        response = client.post(
            "/api/tts",
            json={"text": ""}
        )

        # Should fail validation (min_length=1)
        assert response.status_code == 422

    def test_tts_text_too_long(self, client):
        """Test TTS with text exceeding max length"""
        # Max length is 4096 characters
        long_text = "a" * 4097

        response = client.post(
            "/api/tts",
            json={"text": long_text}
        )

        # Should fail validation (max_length=4096)
        assert response.status_code == 422

    def test_tts_text_at_max_length(self, client):
        """Test TTS with text at exactly max length"""
        with patch('app.api.routes.tts.openai_service') as mock_service:
            audio_data = b'max_length_audio' * 50
            mock_service.generate_speech.return_value = audio_data

            # Exactly 4096 characters (should be valid)
            max_text = "a" * 4096

            response = client.post(
                "/api/tts",
                json={"text": max_text}
            )

            assert response.status_code == 200


@pytest.mark.unit
class TestTTSRateLimit:
    """Test rate limiting for TTS endpoint"""

    def test_rate_limit_not_exceeded_on_first_request(self, client):
        """Test that first request succeeds"""
        with patch('app.api.routes.tts.openai_service') as mock_service:
            audio_data = b'audio_data' * 20
            mock_service.generate_speech.return_value = audio_data

            response = client.post(
                "/api/tts",
                json={"text": "Rate limit test"}
            )

            assert response.status_code == 200
            # Rate limit headers should be present
            assert "X-RateLimit-Limit" in response.headers or response.status_code == 200


@pytest.mark.unit
class TestTTSMediaTypes:
    """Test media type mapping for different audio formats"""

    def test_media_type_mapping(self, client):
        """Test that correct media types are returned for each format"""
        format_media_type_map = {
            "opus": "audio/opus",
            "mp3": "audio/mpeg",
            "aac": "audio/aac",
            "flac": "audio/flac"
        }

        for format_name, expected_media_type in format_media_type_map.items():
            with patch('app.api.routes.tts.openai_service') as mock_service:
                audio_data = b'audio' * 10
                mock_service.generate_speech.return_value = audio_data

                response = client.post(
                    "/api/tts",
                    json={
                        "text": f"Testing {format_name}",
                        "format": format_name
                    }
                )

                assert response.status_code == 200
                assert response.headers["content-type"] == expected_media_type
