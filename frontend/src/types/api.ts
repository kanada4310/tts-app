/**
 * API Request/Response types
 */

// OCR Types
export interface OCROptions {
  exclude_annotations?: boolean
  language?: string
}

export interface OCRRequest {
  image: string // base64 encoded
  options?: OCROptions
}

export interface OCRResponse {
  text: string
  confidence: 'high' | 'medium' | 'low'
  processing_time: number
}

// TTS Types
export interface TTSRequest {
  text: string
  voice?: string
  format?: string
}

// Error Response
export interface APIError {
  error: string
  message: string
}
