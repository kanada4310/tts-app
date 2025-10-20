/**
 * Audio Configuration Constants
 */

export const AUDIO_CONFIG = {
  SPEED_MIN: 0.5,
  SPEED_MAX: 1.25,
  SPEED_DEFAULT: 1.0,
  SPEED_STEP: 0.05,
} as const

export const PAUSE_OPTIONS = [1, 2, 3, 4, 5] as const

export const TTS_VOICE = 'nova'
export const TTS_FORMAT = 'opus'
