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
 * @returns Object with array of audio blobs, durations, total duration, and cache info
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
  fromCache?: boolean
}> {
  const request: TTSRequest = {
    text,
    voice,
    format,
    sentences,
  }

  // Call separated endpoint (supports both Supabase and non-Supabase modes)
  const response = await apiPost<{
    // Supabase enabled response
    audio_urls?: string[]
    durations?: number[]
    total_duration: number
    from_cache?: boolean
    format: string
    // Supabase disabled response (backward compatibility)
    audio_segments?: Array<{
      audio_data: string
      duration: number
    }>
  }>(API_ENDPOINTS.TTS_WITH_TIMINGS_SEPARATED, request)

  const audioBlobs: Blob[] = []
  const durations: number[] = []

  // Check if Supabase is enabled (audio_urls present)
  if (response.audio_urls && response.durations) {
    console.log(`[TTS] Using Supabase audio URLs (from_cache=${response.from_cache})`)

    // Fetch audio from URLs
    for (let i = 0; i < response.audio_urls.length; i++) {
      const url = response.audio_urls[i]
      try {
        const audioResponse = await fetch(url)
        if (!audioResponse.ok) {
          throw new Error(`Failed to fetch audio from ${url}: ${audioResponse.statusText}`)
        }
        const audioBlob = await audioResponse.blob()
        audioBlobs.push(audioBlob)
        durations.push(response.durations[i])
      } catch (error) {
        console.error(`[TTS] Error fetching audio segment ${i}:`, error)
        throw new Error(`音声セグメント ${i + 1} の読み込みに失敗しました`)
      }
    }

    return {
      audioBlobs,
      durations,
      totalDuration: response.total_duration,
      fromCache: response.from_cache,
    }
  }

  // Fallback: Supabase disabled, use base64 blobs (backward compatibility)
  if (response.audio_segments) {
    console.log('[TTS] Using base64 audio segments (Supabase not configured)')

    for (const segment of response.audio_segments) {
      // Decode base64
      const audioData = atob(segment.audio_data)
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

  // No valid response format
  throw new Error('Invalid TTS response format: missing both audio_urls and audio_segments')
}
