"""OpenAI TTS service"""
from typing import List, Tuple, Dict
from openai import OpenAI
from io import BytesIO
import wave
import struct
import shutil
import os
import tempfile
import base64

# Configure environment for pydub BEFORE importing it
def _setup_ffmpeg_environment():
    """Setup environment variables for ffmpeg before pydub import"""
    import platform

    # Check if ffmpeg is already in PATH (common in Linux/Railway/Docker)
    ffmpeg_in_path = shutil.which("ffmpeg")
    ffprobe_in_path = shutil.which("ffprobe")

    if ffmpeg_in_path and ffprobe_in_path:
        print(f"[OK] ffmpeg found in PATH: {ffmpeg_in_path}")
        print(f"[OK] ffprobe found in PATH: {ffprobe_in_path}")
        return True

    # If not in PATH, check common installation locations (Windows-specific)
    if platform.system() == "Windows":
        possible_paths = [
            # Chocolatey installation
            (r"C:\ProgramData\chocolatey\bin\ffmpeg.exe", r"C:\ProgramData\chocolatey\bin\ffprobe.exe"),
            (r"C:\ProgramData\chocolatey\lib\ffmpeg\tools\ffmpeg\bin\ffmpeg.exe",
             r"C:\ProgramData\chocolatey\lib\ffmpeg\tools\ffmpeg\bin\ffprobe.exe"),
            # Manual installation paths
            (r"C:\ffmpeg\bin\ffmpeg.exe", r"C:\ffmpeg\bin\ffprobe.exe"),
            (r"C:\Program Files\ffmpeg\bin\ffmpeg.exe", r"C:\Program Files\ffmpeg\bin\ffprobe.exe"),
        ]

        for ffmpeg_path, ffprobe_path in possible_paths:
            if os.path.exists(ffmpeg_path) and os.path.exists(ffprobe_path):
                # Add directory to PATH
                ffmpeg_dir = os.path.dirname(ffmpeg_path)
                if ffmpeg_dir not in os.environ.get('PATH', ''):
                    os.environ['PATH'] = ffmpeg_dir + os.pathsep + os.environ.get('PATH', '')

                print(f"[OK] ffmpeg found and configured: {ffmpeg_path}")
                print(f"[OK] ffprobe found and configured: {ffprobe_path}")
                return True

        print(f"[WARNING] ffmpeg not found in common locations")
        print(f"  Tried: {[p[0] for p in possible_paths]}")
    else:
        print(f"[WARNING] ffmpeg not found in PATH on {platform.system()}")

    return False

# Setup ffmpeg environment before any imports
_ffmpeg_configured = _setup_ffmpeg_environment()

from app.core.config import settings
from app.core.constants import (
    OPENAI_TTS_MODEL,
    OPENAI_TTS_SPEED,
    ERROR_TTS_FAILED,
)
from app.core.errors import TTSError, TTSGenerationError
from app.schemas.tts import SentenceTiming


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

    def _get_audio_duration(self, audio_data: bytes, format: str) -> float:
        """
        Calculate audio duration from audio data using temporary file

        Args:
            audio_data: Audio file bytes
            format: Audio format (opus, mp3, aac, flac)

        Returns:
            Duration in seconds
        """
        try:
            from pydub import AudioSegment

            # Use temporary file for more reliable ffmpeg processing
            with tempfile.NamedTemporaryFile(suffix=f'.{format}', delete=False) as temp_file:
                temp_path = temp_file.name
                temp_file.write(audio_data)

            try:
                audio = AudioSegment.from_file(temp_path, format=format)
                # Duration in milliseconds, convert to seconds
                duration = len(audio) / 1000.0
                return duration
            finally:
                # Clean up temporary file
                try:
                    os.unlink(temp_path)
                except Exception:
                    pass  # Ignore cleanup errors

        except Exception as e:
            # Fallback: estimate based on text length
            print(f"Warning: Could not get accurate duration: {str(e)}")
            return 0.0

    def generate_speech_with_timings(
        self,
        sentences: List[str],
        voice: str = "nova",
        format: str = "opus"
    ) -> Tuple[bytes, List[SentenceTiming], float]:
        """
        Generate speech from sentences with precise timing information

        Args:
            sentences: List of sentences to convert to speech
            voice: Voice to use (alloy, echo, fable, onyx, nova, shimmer)
            format: Audio format (opus, mp3, aac, flac)

        Returns:
            Tuple of (combined_audio_data, sentence_timings, total_duration)

        Raises:
            TTSGenerationError: If TTS generation fails
        """
        try:
            from pydub import AudioSegment

            # Validate inputs
            valid_voices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]
            if voice not in valid_voices:
                raise TTSGenerationError(
                    f"Invalid voice: {voice}. Must be one of {valid_voices}",
                    error_code=ERROR_TTS_FAILED
                )

            valid_formats = ["opus", "mp3", "aac", "flac"]
            if format not in valid_formats:
                raise TTSGenerationError(
                    f"Invalid format: {format}. Must be one of {valid_formats}",
                    error_code=ERROR_TTS_FAILED
                )

            if not sentences or len(sentences) == 0:
                raise TTSGenerationError(
                    "No sentences provided",
                    error_code=ERROR_TTS_FAILED
                )

            # Generate TTS for each sentence
            sentence_timings = []
            audio_segments = []
            current_time = 0.0

            # Gap between sentences in milliseconds (200ms = 0.2 seconds)
            sentence_gap_ms = 200
            sentence_gap_s = sentence_gap_ms / 1000.0

            for sentence_text in sentences:
                if not sentence_text.strip():
                    continue

                # Generate TTS for this sentence
                response = self.client.audio.speech.create(
                    model=OPENAI_TTS_MODEL,
                    voice=voice,
                    input=sentence_text,
                    response_format=format,
                    speed=OPENAI_TTS_SPEED
                )

                # Read audio data
                audio_data = BytesIO()
                for chunk in response.iter_bytes():
                    audio_data.write(chunk)
                audio_bytes = audio_data.getvalue()

                # Get precise duration
                duration = self._get_audio_duration(audio_bytes, format)

                # Store timing information
                sentence_timings.append(SentenceTiming(
                    text=sentence_text,
                    start_time=current_time,
                    end_time=current_time + duration,
                    duration=duration
                ))

                # Load audio segment using temporary file (more reliable with ffmpeg)
                with tempfile.NamedTemporaryFile(suffix=f'.{format}', delete=False) as temp_file:
                    temp_path = temp_file.name
                    temp_file.write(audio_bytes)

                try:
                    segment = AudioSegment.from_file(temp_path, format=format)
                finally:
                    # Clean up temporary file
                    try:
                        os.unlink(temp_path)
                    except Exception:
                        pass  # Ignore cleanup errors

                audio_segments.append(segment)
                current_time += duration

                # Add gap time for all sentences except the last one
                # (We'll add the actual silence during concatenation)
                if len(audio_segments) < len([s for s in sentences if s.strip()]):
                    current_time += sentence_gap_s

            # Combine all audio segments
            if len(audio_segments) == 0:
                raise TTSGenerationError(
                    "No valid sentences to convert",
                    error_code=ERROR_TTS_FAILED
                )

            # Create silence segment for gaps between sentences
            silence = AudioSegment.silent(duration=sentence_gap_ms)

            combined_audio = audio_segments[0]
            for segment in audio_segments[1:]:
                # Add silence between sentences
                combined_audio = combined_audio + silence + segment

            print(f"[TTS Generation] Added {sentence_gap_ms}ms silence between {len(audio_segments)-1} sentence pairs")

            # Get the ACTUAL duration of the combined audio
            actual_combined_duration = len(combined_audio) / 1000.0  # pydub uses milliseconds
            estimated_total_duration = current_time

            print(f"[TTS Timing] Estimated total: {estimated_total_duration:.3f}s, Actual combined: {actual_combined_duration:.3f}s, Diff: {abs(actual_combined_duration - estimated_total_duration):.3f}s")

            # If there's a significant difference, adjust the timings proportionally
            if abs(actual_combined_duration - estimated_total_duration) > 0.05:  # More than 50ms difference
                print(f"[TTS Timing] Adjusting timestamps due to {abs(actual_combined_duration - estimated_total_duration):.3f}s difference")
                scale_factor = actual_combined_duration / estimated_total_duration if estimated_total_duration > 0 else 1.0

                for timing in sentence_timings:
                    original_start = timing.start_time
                    original_end = timing.end_time
                    timing.start_time = timing.start_time * scale_factor
                    timing.end_time = timing.end_time * scale_factor
                    timing.duration = timing.end_time - timing.start_time
                    print(f"[TTS Timing]   Adjusted sentence: {original_start:.3f}s -> {timing.start_time:.3f}s")

            # Export combined audio to bytes
            output_io = BytesIO()
            combined_audio.export(output_io, format=format)
            combined_audio_bytes = output_io.getvalue()

            total_duration = actual_combined_duration

            return combined_audio_bytes, sentence_timings, total_duration

        except TTSGenerationError:
            raise
        except Exception as e:
            raise TTSGenerationError(
                f"OpenAI TTS with timings failed: {str(e)}",
                error_code=ERROR_TTS_FAILED
            ) from e

    def generate_speech_separated(
        self,
        sentences: List[str],
        voice: str = "nova",
        format: str = "mp3"
    ) -> Tuple[List[Dict], float]:
        """
        Generate speech with separated audio files per sentence

        Args:
            sentences: List of sentences to convert to speech
            voice: Voice to use (alloy, echo, fable, onyx, nova, shimmer)
            format: Audio format (mp3 recommended for compatibility)

        Returns:
            Tuple of (audio_segments, total_duration)

            audio_segments: List of dicts with:
                - index: int (sentence index)
                - audio_base64: str (base64-encoded audio)
                - text: str (sentence text)
                - duration: float (audio duration in seconds)

            total_duration: float (sum of all segment durations)

        Raises:
            TTSGenerationError: If TTS generation fails
        """
        try:
            # Validate inputs
            valid_voices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]
            if voice not in valid_voices:
                raise TTSGenerationError(
                    f"Invalid voice: {voice}. Must be one of {valid_voices}",
                    error_code=ERROR_TTS_FAILED
                )

            valid_formats = ["opus", "mp3", "aac", "flac"]
            if format not in valid_formats:
                raise TTSGenerationError(
                    f"Invalid format: {format}. Must be one of {valid_formats}",
                    error_code=ERROR_TTS_FAILED
                )

            if not sentences or len(sentences) == 0:
                raise TTSGenerationError(
                    "No sentences provided",
                    error_code=ERROR_TTS_FAILED
                )

            # Generate TTS for each sentence
            audio_segments = []
            total_duration = 0.0

            for idx, sentence_text in enumerate(sentences):
                if not sentence_text.strip():
                    continue

                # Generate TTS for this sentence
                response = self.client.audio.speech.create(
                    model=OPENAI_TTS_MODEL,
                    voice=voice,
                    input=sentence_text,
                    response_format=format,
                    speed=OPENAI_TTS_SPEED
                )

                # Read audio data
                audio_data = BytesIO()
                for chunk in response.iter_bytes():
                    audio_data.write(chunk)
                audio_bytes = audio_data.getvalue()

                # Get precise duration
                duration = self._get_audio_duration(audio_bytes, format)

                # Encode to base64
                audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')

                # Store segment
                audio_segments.append({
                    "index": idx,
                    "audio_base64": audio_base64,
                    "text": sentence_text,
                    "duration": duration
                })

                total_duration += duration

                print(f"[TTS Separated] Sentence {idx}: {duration:.3f}s, text: {sentence_text[:30]}...")

            print(f"[TTS Separated] Generated {len(audio_segments)} separate audio files, total: {total_duration:.3f}s")

            return audio_segments, total_duration

        except TTSGenerationError:
            raise
        except Exception as e:
            raise TTSGenerationError(
                f"OpenAI TTS separated generation failed: {str(e)}",
                error_code=ERROR_TTS_FAILED
            ) from e


# Global instance
openai_service = OpenAIService()
