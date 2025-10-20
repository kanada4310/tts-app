/**
 * TTS (Text-to-Speech) API Service
 */

import { API_ENDPOINTS } from '@/constants/api'
import { apiPostBinary, apiPost } from './client'
import type { TTSRequest, TTSResponseWithTimings } from '@/types/api'

/**
 * Converts text to speech audio
 *
 * @param text - Text to convert to speech
 * @param voice - Voice type (default: 'nova')
 * @param format - Audio format (default: 'mp3')
 * @returns Audio blob
 */
export async function performTTS(
  text: string,
  voice: string = 'nova',
  format: string = 'mp3'
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

/**
 * Converts text to speech with sentence-level timings
 *
 * @param text - Text to convert to speech
 * @param sentences - Array of sentences for precise timing
 * @param voice - Voice type (default: 'nova')
 * @param format - Audio format (default: 'mp3')
 * @returns Object with audio blob and sentence timings
 */
export async function performTTSWithTimings(
  text: string,
  sentences: string[],
  voice: string = 'nova',
  format: string = 'mp3'
): Promise<{ audioBlob: Blob; timings: TTSResponseWithTimings }> {
  const request: TTSRequest = {
    text,
    voice,
    format,
    sentences,
  }

  // Use dedicated endpoint for TTS with timings
  const response = await apiPost<TTSResponseWithTimings>(API_ENDPOINTS.TTS_WITH_TIMINGS, request)

  // Decode base64 audio data to blob
  const audioData = atob(response.audio_data)
  const audioArray = new Uint8Array(audioData.length)
  for (let i = 0; i < audioData.length; i++) {
    audioArray[i] = audioData.charCodeAt(i)
  }

  const mimeType = format === 'mp3' ? 'audio/mpeg' : format === 'opus' ? 'audio/opus' : `audio/${format}`
  const audioBlob = new Blob([audioArray], { type: mimeType })

  return { audioBlob, timings: response }
}
