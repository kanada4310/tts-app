"""Pytest configuration and fixtures"""
import base64
import pytest
import os
from fastapi.testclient import TestClient
from unittest.mock import Mock, MagicMock

# Set test environment variables before importing app
os.environ["ANTHROPIC_API_KEY"] = "test-anthropic-key"
os.environ["OPENAI_API_KEY"] = "test-openai-key"

from app.main import app


@pytest.fixture
def client():
    """FastAPI test client"""
    return TestClient(app)


@pytest.fixture
def sample_base64_image():
    """Sample base64 encoded image for testing"""
    # 1x1 pixel PNG image (minimal valid PNG)
    png_data = (
        b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00'
        b'\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc'
        b'\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
    )
    return base64.b64encode(png_data).decode('utf-8')


@pytest.fixture
def sample_base64_jpeg():
    """Sample base64 encoded JPEG image for testing"""
    # Minimal valid JPEG
    jpeg_data = (
        b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00'
        b'\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c'
        b'\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c'
        b'\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x0b\x08\x00'
        b'\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01'
        b'\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05'
        b'\x06\x07\x08\t\n\x0b\xff\xc4\x00\xb5\x10\x00\x02\x01\x03\x03\x02\x04'
        b'\x03\x05\x05\x04\x04\x00\x00\x01}\x01\x02\x03\x00\x04\x11\x05\x12!1A'
        b'\x06\x13Qa\x07"q\x142\x81\x91\xa1\x08#B\xb1\xc1\x15R\xd1\xf0$3br\x82'
        b'\t\n\x16\x17\x18\x19\x1a%&\'()*456789:CDEFGHIJSTUVWXYZcdefghijstuvwxyz'
        b'\x83\x84\x85\x86\x87\x88\x89\x8a\x92\x93\x94\x95\x96\x97\x98\x99\x9a'
        b'\xa2\xa3\xa4\xa5\xa6\xa7\xa8\xa9\xaa\xb2\xb3\xb4\xb5\xb6\xb7\xb8\xb9'
        b'\xba\xc2\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xd2\xd3\xd4\xd5\xd6\xd7\xd8'
        b'\xd9\xda\xe1\xe2\xe3\xe4\xe5\xe6\xe7\xe8\xe9\xea\xf1\xf2\xf3\xf4\xf5'
        b'\xf6\xf7\xf8\xf9\xfa\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xfb\xfe('
        b'\xa2\x8a\x00\xff\xd9'
    )
    return base64.b64encode(jpeg_data).decode('utf-8')


@pytest.fixture
def sample_data_url_image(sample_base64_image):
    """Sample data URL encoded image"""
    return f"data:image/png;base64,{sample_base64_image}"


@pytest.fixture
def mock_claude_message():
    """Mock Claude API message response"""
    mock_message = MagicMock()
    mock_message.content = [MagicMock(text="Sample extracted text")]
    mock_message.stop_reason = "end_turn"
    return mock_message


@pytest.fixture
def mock_openai_response():
    """Mock OpenAI TTS API response"""
    mock_response = MagicMock()
    # Create a mock audio data stream
    audio_data = b'\x00\x01\x02\x03' * 100  # Sample audio bytes
    mock_response.iter_bytes.return_value = [audio_data[i:i+50] for i in range(0, len(audio_data), 50)]
    return mock_response
