/**
 * API Request/Response types
 */

// OCR Types
export interface OCROptions {
  exclude_annotations?: boolean
  language?: string
  page_separator?: string
}

export interface OCRRequest {
  image?: string // base64 encoded (for single image)
  images?: string[] // array of base64 encoded images (for multiple images)
  options?: OCROptions
}

export interface OCRResponse {
  text: string
  confidence: 'high' | 'medium' | 'low'
  processing_time: number
  page_count: number
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
