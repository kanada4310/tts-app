"""Application constants"""

# Claude API
CLAUDE_MODEL = "claude-3-5-sonnet-20240620"  # Claude 3.5 Sonnet
CLAUDE_MAX_TOKENS = 4096

# OpenAI TTS API
OPENAI_TTS_MODEL = "tts-1-hd"
OPENAI_TTS_VOICE = "nova"
OPENAI_TTS_SPEED = 1.0
OPENAI_TTS_FORMAT = "mp3"  # Changed from opus due to ffmpeg compatibility

# Image Processing
SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png"]
IMAGE_COMPRESSION_FORMAT = "JPEG"

# Response Times (seconds)
OCR_TIMEOUT = 30
TTS_TIMEOUT = 30

# Error Messages
ERROR_INVALID_IMAGE = "invalid_image"
ERROR_IMAGE_TOO_LARGE = "image_too_large"
ERROR_UNSUPPORTED_FORMAT = "unsupported_format"
ERROR_OCR_FAILED = "ocr_failed"
ERROR_TTS_FAILED = "tts_failed"
ERROR_RATE_LIMIT = "rate_limit_exceeded"
ERROR_INTERNAL = "internal_error"
