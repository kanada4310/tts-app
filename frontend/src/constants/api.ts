/**
 * API Configuration Constants
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const API_ENDPOINTS = {
  OCR: '/api/ocr',
  TTS: '/api/tts',
  HEALTH: '/health',
} as const

export const API_TIMEOUT = 30000 // 30 seconds
