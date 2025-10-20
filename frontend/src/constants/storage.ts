/**
 * Storage Configuration Constants
 */

export const STORAGE_CONFIG = {
  DB_NAME: 'tts-app-db',
  DB_VERSION: 1,
  AUDIO_STORE: 'audio-cache',
  TEXT_STORE: 'text-cache',
  MAX_CACHE_SIZE_MB: 100,
  CACHE_EXPIRY_DAYS: 30,
} as const

export const LOCAL_STORAGE_KEYS = {
  SETTINGS: 'tts-settings',
  LAST_SPEED: 'tts-last-speed',
  LAST_PAUSE: 'tts-last-pause',
} as const
