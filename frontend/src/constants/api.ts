/**
 * API Configuration Constants
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const API_ENDPOINTS = {
  OCR: '/api/ocr',
  TTS: '/api/tts',
  TTS_WITH_TIMINGS: '/api/tts-with-timings',
  TTS_WITH_TIMINGS_SEPARATED: '/api/tts-with-timings-separated',
  HEALTH: '/health',
} as const

export const API_TIMEOUT = 300000 // 300 seconds (5 minutes - for TTS generation with many sentences)
