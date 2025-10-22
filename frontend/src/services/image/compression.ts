/**
 * Image Compression Service
 *
 * Handles image compression according to specifications:
 * - Max dimension: 2000px (longer side)
 * - Quality: 85%
 * - Supported formats: JPEG, PNG
 */

import { IMAGE_CONFIG } from '@/constants/image'
import { MESSAGES } from '@/constants/messages'

export interface CompressionOptions {
  maxDimension?: number
  quality?: number
  format?: 'image/jpeg' | 'image/png'
}

export interface CompressionResult {
  dataUrl: string
  originalSize: number
  compressedSize: number
  width: number
  height: number
}

/**
 * Compresses an image file
 */
export async function compressImage(
  file: File,
  options?: CompressionOptions
): Promise<CompressionResult> {
  const maxDimension = options?.maxDimension || IMAGE_CONFIG.MAX_DIMENSION
  const quality = options?.quality || IMAGE_CONFIG.COMPRESSION_QUALITY
  const format = options?.format || 'image/jpeg'

  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      if (!e.target?.result) {
        reject(new Error('Failed to read file'))
        return
      }

      img.onload = () => {
        try {
          const result = processImage(img, maxDimension, quality, format, file.size)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }

      img.src = e.target.result as string
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Processes the image: resizes and compresses
 */
function processImage(
  img: HTMLImageElement,
  maxDimension: number,
  quality: number,
  format: string,
  originalSize: number
): CompressionResult {
  // Calculate new dimensions
  const { width, height } = calculateDimensions(
    img.width,
    img.height,
    maxDimension
  )

  // Create canvas
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  // Draw image
  ctx.drawImage(img, 0, 0, width, height)

  // Convert to data URL
  const dataUrl = canvas.toDataURL(format, quality)
  const compressedSize = estimateDataUrlSize(dataUrl)

  return {
    dataUrl,
    originalSize,
    compressedSize,
    width,
    height
  }
}

/**
 * Calculates new dimensions maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxDimension: number
): { width: number; height: number } {
  const longerSide = Math.max(originalWidth, originalHeight)

  if (longerSide <= maxDimension) {
    return { width: originalWidth, height: originalHeight }
  }

  const ratio = maxDimension / longerSide

  return {
    width: Math.round(originalWidth * ratio),
    height: Math.round(originalHeight * ratio)
  }
}

/**
 * Estimates the size of a data URL in bytes
 */
function estimateDataUrlSize(dataUrl: string): number {
  // Remove data URL prefix to get base64 string
  const base64 = dataUrl.split(',')[1]
  // Each base64 character represents 6 bits, 4 characters = 3 bytes
  return Math.round((base64.length * 3) / 4)
}

/**
 * Validates image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!IMAGE_CONFIG.ALLOWED_TYPES.includes(file.type as 'image/jpeg' | 'image/png')) {
    return {
      valid: false,
      error: `${MESSAGES.ERROR_IMAGE_FORMAT}\n${MESSAGES.ERROR_DETAILS}：\n・${MESSAGES.ERROR_CHECK_FORMAT}`
    }
  }

  // Check file size
  if (file.size > IMAGE_CONFIG.MAX_SIZE) {
    return {
      valid: false,
      error: `${MESSAGES.ERROR_IMAGE_SIZE}\n${MESSAGES.ERROR_DETAILS}：\n・${MESSAGES.ERROR_CHECK_SIZE}`
    }
  }

  return { valid: true }
}

/**
 * Converts data URL to base64 (removes prefix)
 */
export function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.split(',')[1]
}
