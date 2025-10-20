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
  sentences: string[]
  confidence: 'high' | 'medium' | 'low'
  processing_time: number
  page_count: number
}

// TTS Types
export interface TTSRequest {
  text: string
  voice?: string
  format?: string
  sentences?: string[] // Optional sentences for precise timing
}

export interface SentenceTiming {
  text: string
  start_time: number
  end_time: number
  duration: number
}

export interface TTSResponseWithTimings {
  audio_data: string // base64 encoded
  sentence_timings: SentenceTiming[]
  total_duration: number
  format: string
}

// Error Response
export interface APIError {
  error: string
  message: string
}
