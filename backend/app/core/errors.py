"""Custom error classes"""


class TTSError(Exception):
    """Base exception for TTS application"""
    def __init__(self, message: str, error_code: str):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)


class ImageProcessingError(TTSError):
    """Image processing related errors"""
    pass


class OCRError(TTSError):
    """OCR processing errors"""
    pass


class TTSGenerationError(TTSError):
    """TTS generation errors"""
    pass


class RateLimitError(TTSError):
    """Rate limit exceeded"""
    pass
