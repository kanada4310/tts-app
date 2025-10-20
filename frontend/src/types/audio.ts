/**
 * Audio-related types
 */

export interface AudioPlayerState {
  isPlaying: boolean
  currentTime: number
  duration: number
  speed: number
}

export interface RepeatConfig {
  enabled: boolean
  pauseDuration: number // seconds
  currentSentence: number
  totalSentences: number
}

export interface SentenceBoundary {
  text: string
  startIndex: number
  endIndex: number
  timestamp: number // estimated audio timestamp in seconds
  preview: string // first 5-10 words for tooltip
}

export interface PauseConfig {
  enabled: boolean
  duration: number // seconds (0-5, 0.5 step)
}
