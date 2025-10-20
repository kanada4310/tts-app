/**
 * OCR API Service
 */

import { API_ENDPOINTS } from '@/constants/api'
import { apiPost } from './client'
import type { OCRRequest, OCRResponse } from '@/types/api'

/**
 * Sends a single image to the OCR API and returns extracted text
 *
 * @param image - Base64-encoded image string
 * @param options - OCR options
 * @returns OCR response with extracted text
 */
export async function performOCR(
  image: string,
  options?: OCRRequest['options']
): Promise<OCRResponse> {
  const request: OCRRequest = {
    image,
    options: options || {
      exclude_annotations: true,
      language: 'auto',
    },
  }

  return apiPost<OCRResponse, OCRRequest>(API_ENDPOINTS.OCR, request)
}

/**
 * Sends multiple images to the OCR API and returns combined extracted text
 *
 * @param images - Array of base64-encoded image strings
 * @param options - OCR options
 * @returns OCR response with combined extracted text from all images
 */
export async function performOCRMultiple(
  images: string[],
  options?: OCRRequest['options']
): Promise<OCRResponse> {
  const request: OCRRequest = {
    images,
    options: options || {
      exclude_annotations: true,
      language: 'auto',
      page_separator: '\n\n',
    },
  }

  return apiPost<OCRResponse, OCRRequest>(API_ENDPOINTS.OCR, request)
}
