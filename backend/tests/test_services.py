"""Tests for service layer (Claude and OpenAI services)"""
import pytest
from unittest.mock import patch, MagicMock
import base64

from app.services.claude_service import ClaudeService
from app.services.openai_service import OpenAIService
from app.core.errors import OCRError, TTSGenerationError
from app.core.constants import (
    ERROR_OCR_FAILED,
    ERROR_TTS_FAILED,
    CLAUDE_MODEL,
    OPENAI_TTS_MODEL
)


@pytest.mark.unit
class TestClaudeService:
    """Test cases for Claude service"""

    def test_get_media_type_from_data_url(self):
        """Test media type extraction from data URL"""
        service = ClaudeService()

        # PNG data URL
        png_data_url = "data:image/png;base64,iVBORw0KG..."
        assert service._get_media_type(png_data_url) == "image/png"

        # JPEG data URL
        jpeg_data_url = "data:image/jpeg;base64,/9j/4AAQ..."
        assert service._get_media_type(jpeg_data_url) == "image/jpeg"

    def test_get_media_type_default(self):
        """Test default media type for plain base64"""
        service = ClaudeService()
        plain_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB..."
        assert service._get_media_type(plain_base64) == "image/jpeg"

    def test_clean_base64_data_with_data_url(self):
        """Test cleaning base64 data with data URL prefix"""
        service = ClaudeService()
        data_url = "data:image/png;base64,ABC123DEF456"
        cleaned = service._clean_base64_data(data_url)
        assert cleaned == "ABC123DEF456"

    def test_clean_base64_data_without_prefix(self):
        """Test cleaning base64 data without prefix"""
        service = ClaudeService()
        plain_base64 = "ABC123DEF456"
        cleaned = service._clean_base64_data(plain_base64)
        assert cleaned == "ABC123DEF456"

    def test_build_prompt_default(self):
        """Test prompt building with default options"""
        service = ClaudeService()
        prompt = service._build_prompt(
            exclude_annotations=True,
            language="en"
        )

        assert "extract all the text" in prompt.lower()
        assert "exclude any handwritten" in prompt.lower()
        assert "without any additional commentary" in prompt.lower()

    def test_build_prompt_include_annotations(self):
        """Test prompt building with annotations included"""
        service = ClaudeService()
        prompt = service._build_prompt(
            exclude_annotations=False,
            language="en"
        )

        assert "extract all the text" in prompt.lower()
        assert "exclude any handwritten" not in prompt.lower()

    def test_build_prompt_japanese(self):
        """Test prompt building with Japanese language"""
        service = ClaudeService()
        prompt = service._build_prompt(
            exclude_annotations=True,
            language="ja"
        )

        assert "ja" in prompt.lower() or "japanese" in prompt.lower()

    def test_determine_confidence_high(self):
        """Test confidence determination for successful completion"""
        service = ClaudeService()
        mock_message = MagicMock()
        mock_message.stop_reason = "end_turn"

        confidence = service._determine_confidence(mock_message)
        assert confidence == "high"

    def test_determine_confidence_medium(self):
        """Test confidence determination for max_tokens"""
        service = ClaudeService()
        mock_message = MagicMock()
        mock_message.stop_reason = "max_tokens"

        confidence = service._determine_confidence(mock_message)
        assert confidence == "medium"

    def test_determine_confidence_low(self):
        """Test confidence determination for other stop reasons"""
        service = ClaudeService()
        mock_message = MagicMock()
        mock_message.stop_reason = "stop_sequence"

        confidence = service._determine_confidence(mock_message)
        assert confidence == "low"

    def test_extract_text_success(self, sample_base64_image, mock_claude_message):
        """Test successful text extraction"""
        with patch('app.services.claude_service.Anthropic') as mock_anthropic:
            mock_client = MagicMock()
            mock_anthropic.return_value = mock_client
            mock_client.messages.create.return_value = mock_claude_message

            service = ClaudeService()
            text, confidence, processing_time = service.extract_text(
                image_data=sample_base64_image,
                exclude_annotations=True,
                language="en"
            )

            assert text == "Sample extracted text"
            assert confidence == "high"
            assert processing_time >= 0

            # Verify API was called correctly
            mock_client.messages.create.assert_called_once()
            call_kwargs = mock_client.messages.create.call_args[1]
            assert call_kwargs["model"] == CLAUDE_MODEL

    def test_extract_text_with_data_url(self, sample_data_url_image, mock_claude_message):
        """Test text extraction with data URL format"""
        with patch('app.services.claude_service.Anthropic') as mock_anthropic:
            mock_client = MagicMock()
            mock_anthropic.return_value = mock_client
            mock_client.messages.create.return_value = mock_claude_message

            service = ClaudeService()
            text, confidence, processing_time = service.extract_text(
                image_data=sample_data_url_image,
                exclude_annotations=True,
                language="en"
            )

            assert text == "Sample extracted text"
            # Verify data URL was cleaned
            call_kwargs = mock_client.messages.create.call_args[1]
            # The cleaned data should not contain "data:image"
            messages = call_kwargs["messages"]
            image_content = [c for c in messages[0]["content"] if c["type"] == "image"][0]
            assert not image_content["source"]["data"].startswith("data:")

    def test_extract_text_api_error(self, sample_base64_image):
        """Test text extraction when API fails"""
        with patch('app.services.claude_service.Anthropic') as mock_anthropic:
            mock_client = MagicMock()
            mock_anthropic.return_value = mock_client
            mock_client.messages.create.side_effect = Exception("API Error")

            service = ClaudeService()

            with pytest.raises(OCRError) as exc_info:
                service.extract_text(
                    image_data=sample_base64_image,
                    exclude_annotations=True,
                    language="en"
                )

            assert exc_info.value.error_code == ERROR_OCR_FAILED
            assert "API Error" in str(exc_info.value)


@pytest.mark.unit
class TestOpenAIService:
    """Test cases for OpenAI service"""

    def test_generate_speech_success(self, mock_openai_response):
        """Test successful speech generation"""
        with patch('app.services.openai_service.OpenAI') as mock_openai:
            mock_client = MagicMock()
            mock_openai.return_value = mock_client
            mock_client.audio.speech.create.return_value = mock_openai_response

            service = OpenAIService()
            audio_data = service.generate_speech(
                text="Hello, world!",
                voice="nova",
                format="opus"
            )

            assert isinstance(audio_data, bytes)
            assert len(audio_data) > 0

            # Verify API was called correctly
            mock_client.audio.speech.create.assert_called_once()
            call_kwargs = mock_client.audio.speech.create.call_args[1]
            assert call_kwargs["model"] == OPENAI_TTS_MODEL
            assert call_kwargs["voice"] == "nova"
            assert call_kwargs["input"] == "Hello, world!"

    def test_generate_speech_all_voices(self, mock_openai_response):
        """Test speech generation with all valid voices"""
        valid_voices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]

        for voice in valid_voices:
            with patch('app.services.openai_service.OpenAI') as mock_openai:
                mock_client = MagicMock()
                mock_openai.return_value = mock_client
                mock_client.audio.speech.create.return_value = mock_openai_response

                service = OpenAIService()
                audio_data = service.generate_speech(
                    text=f"Testing {voice}",
                    voice=voice,
                    format="opus"
                )

                assert len(audio_data) > 0

    def test_generate_speech_all_formats(self, mock_openai_response):
        """Test speech generation with all valid formats"""
        valid_formats = ["opus", "mp3", "aac", "flac"]

        for format_name in valid_formats:
            with patch('app.services.openai_service.OpenAI') as mock_openai:
                mock_client = MagicMock()
                mock_openai.return_value = mock_client
                mock_client.audio.speech.create.return_value = mock_openai_response

                service = OpenAIService()
                audio_data = service.generate_speech(
                    text=f"Testing {format_name}",
                    voice="nova",
                    format=format_name
                )

                assert len(audio_data) > 0

    def test_generate_speech_invalid_voice(self):
        """Test speech generation with invalid voice"""
        service = OpenAIService()

        with pytest.raises(TTSGenerationError) as exc_info:
            service.generate_speech(
                text="Test",
                voice="invalid_voice",
                format="opus"
            )

        assert exc_info.value.error_code == ERROR_TTS_FAILED
        assert "Invalid voice" in exc_info.value.message

    def test_generate_speech_invalid_format(self):
        """Test speech generation with invalid format"""
        service = OpenAIService()

        with pytest.raises(TTSGenerationError) as exc_info:
            service.generate_speech(
                text="Test",
                voice="nova",
                format="invalid_format"
            )

        assert exc_info.value.error_code == ERROR_TTS_FAILED
        assert "Invalid format" in exc_info.value.message

    def test_generate_speech_api_error(self):
        """Test speech generation when API fails"""
        with patch('app.services.openai_service.OpenAI') as mock_openai:
            mock_client = MagicMock()
            mock_openai.return_value = mock_client
            mock_client.audio.speech.create.side_effect = Exception("API Error")

            service = OpenAIService()

            with pytest.raises(TTSGenerationError) as exc_info:
                service.generate_speech(
                    text="Test",
                    voice="nova",
                    format="opus"
                )

            assert exc_info.value.error_code == ERROR_TTS_FAILED
            assert "API Error" in str(exc_info.value)

    def test_generate_speech_empty_response(self):
        """Test speech generation with empty audio data"""
        with patch('app.services.openai_service.OpenAI') as mock_openai:
            mock_client = MagicMock()
            mock_openai.return_value = mock_client

            # Mock empty response
            mock_response = MagicMock()
            mock_response.iter_bytes.return_value = []
            mock_client.audio.speech.create.return_value = mock_response

            service = OpenAIService()
            audio_data = service.generate_speech(
                text="Test",
                voice="nova",
                format="opus"
            )

            # Should return empty bytes but not crash
            assert audio_data == b''
