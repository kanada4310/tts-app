/**
 * TTS (Text-to-Speech) API Service
 */

import { API_ENDPOINTS } from '@/constants/api'
import { apiPostBinary } from './client'
import type { TTSRequest } from '@/types/api'

/**
 * Converts text to speech audio
 *
 * @param text - Text to convert to speech
 * @param voice - Voice type (default: 'nova')
 * @param format - Audio format (default: 'opus')
 * @returns Audio blob
 */
export async function performTTS(
  text: string,
  voice: string = 'nova',
  format: string = 'opus'
): Promise<Blob> {
  const request: TTSRequest = {
    text,
    voice,
    format,
  }

  return apiPostBinary(API_ENDPOINTS.TTS, request)
}

/**
 * Converts audio blob to object URL for playback
 */
export function createAudioURL(blob: Blob): string {
  return URL.createObjectURL(blob)
}

/**
 * Revokes an object URL to free memory
 */
export function revokeAudioURL(url: string): void {
  URL.revokeObjectURL(url)
}
