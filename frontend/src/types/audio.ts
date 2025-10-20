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
