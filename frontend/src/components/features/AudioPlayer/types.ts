/**
 * AudioPlayer Type Definitions
 *
 * This file contains all TypeScript interfaces and types used by the AudioPlayer component
 * and its related hooks and subcomponents.
 */

import { SentenceTiming } from '../../../types/api'

/**
 * Props for the main AudioPlayer component
 */
export interface AudioPlayerProps {
  audioUrl: string | null
  sourceText?: string
  sourceSentences?: string[]
  sentenceTimings?: SentenceTiming[]
  audioSegments?: Blob[]
  segmentDurations?: number[]
  externalSentenceIndex?: number
  audioRef?: React.RefObject<HTMLAudioElement>
  onPlaybackComplete?: () => void
  onSentenceChange?: (index: number) => void
  onPlayStateChange?: (isPlaying: boolean) => void
}

/**
 * Playback state (playing, paused, time, speed, etc.)
 */
export interface PlaybackState {
  isPlaying: boolean
  currentTime: number
  duration: number
  speed: number
  isLoading: boolean
}

/**
 * Sentence-related state
 */
export interface SentenceState {
  currentIndex: number
  total: number
  timings: SentenceTiming[]
}

/**
 * Repeat control state
 */
export interface RepeatState {
  count: number // 1 (no repeat), 3, 5, -1 (infinite)
  current: number
  autoAdvance: boolean
  autoPauseAfterSentence: boolean
}

/**
 * Audio segment state (for separated audio mode)
 */
export interface SegmentState {
  segments: string[] // Blob URLs
  durations: number[]
  currentIndex: number
  totalDuration: number
  isSegmentMode: boolean
}

/**
 * Pause control settings
 */
export interface PauseSettings {
  enabled: boolean
  duration: number // in seconds (0-5)
}

/**
 * Keyboard shortcut configuration
 */
export interface KeyboardShortcut {
  key: string
  description: string
  action: () => void
}

/**
 * Tooltip state for seekbar
 */
export interface TooltipState {
  visible: boolean
  position: number // 0-100 (percentage)
  text: string
  x: number // pixel position
}
