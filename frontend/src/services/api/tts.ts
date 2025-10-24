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

/**
 * Converts text to speech with separated audio files (one per sentence)
 *
 * @param text - Text to convert to speech
 * @param sentences - Array of sentences
 * @param voice - Voice type (default: 'nova')
 * @param format - Audio format (default: 'mp3')
 * @returns Object with array of audio blobs, durations, and total duration
 */
export async function performTTSSeparated(
  text: string,
  sentences: string[],
  voice: string = 'nova',
  format: string = 'mp3'
): Promise<{
  audioBlobs: Blob[]
  durations: number[]
  totalDuration: number
}> {
  const request: TTSRequest = {
    text,
    voice,
    format,
    sentences,
  }

  // Call new separated endpoint
  const response = await apiPost<{
    audio_segments: Array<{
      index: number
      audio_base64: string
      text: string
      duration: number
    }>
    total_duration: number
    format: string
  }>(API_ENDPOINTS.TTS_WITH_TIMINGS_SEPARATED, request)

  // Decode each audio segment
  const audioBlobs: Blob[] = []
  const durations: number[] = []

  for (const segment of response.audio_segments) {
    // Decode base64
    const audioData = atob(segment.audio_base64)
    const audioArray = new Uint8Array(audioData.length)
    for (let i = 0; i < audioData.length; i++) {
      audioArray[i] = audioData.charCodeAt(i)
    }

    const mimeType = format === 'mp3' ? 'audio/mpeg' : format === 'opus' ? 'audio/opus' : `audio/${format}`
    const audioBlob = new Blob([audioArray], { type: mimeType })

    audioBlobs.push(audioBlob)
    durations.push(segment.duration)
  }

  return {
    audioBlobs,
    durations,
    totalDuration: response.total_duration,
  }
}
