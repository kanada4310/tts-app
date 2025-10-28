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

/**
 * 学習機能用のlocalStorageキー
 */
export const LEARNING_STORAGE_KEYS = {
  // 学習データ全体
  LEARNING_DATA: 'tts-learning-data',

  // 現在のセッション（進行中）
  CURRENT_SESSION: 'tts-current-session',

  // バックアップ（データ損失防止）
  LEARNING_DATA_BACKUP: 'tts-learning-data-backup',
} as const

/**
 * 学習機能の設定値
 */
export const LEARNING_CONFIG = {
  // セッション設定
  AUTO_END_SESSION_AFTER_MINUTES: 30, // 30分無操作でセッション自動終了

  // ストリーク設定
  STREAK_GRACE_PERIOD_HOURS: 24, // 24時間以内なら連続とみなす

  // 統計設定
  MAX_SESSIONS_STORED: 100, // 保存する最大セッション数

  // ブックマーク設定
  MAX_BOOKMARKS: 500, // 最大ブックマーク数

  // localStorage容量管理
  MAX_STORAGE_SIZE_MB: 5, // 最大5MB
} as const
