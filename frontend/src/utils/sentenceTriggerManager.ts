/**
 * Sentence Trigger Manager (Redesigned)
 *
 * New design philosophy:
 * - ALL decisions are made at sentence END (not midpoint)
 * - Repeat間には常に1秒のポーズを挟む（設定変更の余裕を提供）
 * - ポーズ中は再生が停止し、設定変更が即座に反映される
 *
 * Flow examples:
 *
 * No repeat:
 *   Sentence 0 ends → immediately advance to Sentence 1
 *
 * Repeat 3 times:
 *   Sentence 0 (1st) ends → 1s pause → seek to Sentence 0 (2nd)
 *   Sentence 0 (2nd) ends → 1s pause → seek to Sentence 0 (3rd)
 *   Sentence 0 (3rd) ends → advance to Sentence 1
 *
 * Repeat 3 times + Pause between sentences:
 *   Sentence 0 (1st) ends → 1s pause → seek to Sentence 0 (2nd)
 *   Sentence 0 (2nd) ends → 1s pause → seek to Sentence 0 (3rd)
 *   Sentence 0 (3rd) ends → configured pause → advance to Sentence 1
 *
 * Repeat 3 times + Manual pause after sentence:
 *   Sentence 0 (1st) ends → 1s pause → seek to Sentence 0 (2nd)
 *   Sentence 0 (2nd) ends → 1s pause → seek to Sentence 0 (3rd)
 *   Sentence 0 (3rd) ends → manual pause (wait for space key) → advance to Sentence 1
 */

export interface TriggerConfig {
  // Repeat settings
  repeatCount: number           // 1 (no repeat), 3, 5, or -1 (infinite)

  // Pause settings (unified)
  pauseAfterSentence: boolean   // Pause after each sentence (when advancing, not repeating)
  autoResume: boolean           // Auto-resume after pause
  pauseDuration: number         // Pause duration in seconds (only used if autoResume=true)

  // Navigation settings
  autoAdvance: boolean          // Auto-advance to next sentence after repeat
}

export interface SentenceEndEvent {
  sentenceIndex: number
  totalSentences: number
}

export interface TriggerAction {
  type: 'REPEAT' | 'ADVANCE' | 'COMPLETE'
  seekTo: number | null         // Sentence index to seek to (null for COMPLETE)
  pauseDuration: number         // Pause duration in milliseconds (0 = no pause)
  repeatInfo?: {                // Repeat information for display
    current: number
    total: number | string      // number or '∞'
  }
  debugMessage: string
}

const REPEAT_PAUSE_DURATION = 1000 // 1 second pause between repeats (fixed)

export class SentenceTriggerManager {
  private currentSentenceIndex: number = -1
  private currentRepeatCount: number = 0
  private config: TriggerConfig

  constructor(config: TriggerConfig) {
    this.config = config
  }

  /**
   * Handle sentence end event
   * Called when a sentence finishes playing
   */
  handleSentenceEnd(event: SentenceEndEvent): TriggerAction {
    // Track sentence changes (but DON'T reset repeat count during repeats)
    if (event.sentenceIndex !== this.currentSentenceIndex) {
      // Only reset if we're moving to a different sentence (not repeating same sentence)
      // Check if this is the first time we see this sentence
      if (this.currentSentenceIndex !== -1 && event.sentenceIndex !== this.currentSentenceIndex) {
        // Moving to a truly different sentence, reset repeat count
        this.currentRepeatCount = 0
      }
      this.currentSentenceIndex = event.sentenceIndex
    }

    // Step 1: Check if should repeat current sentence
    if (this.shouldRepeat()) {
      return this.handleRepeat(event)
    }

    // Step 2: Move to next sentence or complete
    this.currentRepeatCount = 0 // Reset for next sentence

    if (event.sentenceIndex >= event.totalSentences - 1) {
      // Last sentence completed
      return this.handleComplete(event)
    }

    // Step 3: Advance to next sentence with pause settings
    return this.handleAdvance(event)
  }

  /**
   * Check if should repeat current sentence
   * Uses the LATEST config (allows real-time config changes)
   */
  private shouldRepeat(): boolean {
    const { repeatCount } = this.config

    // repeatCount=1 means play once (no repeat)
    if (repeatCount === 1) return false

    // repeatCount=-1 means infinite repeat
    if (repeatCount === -1) return true

    // repeatCount=3 means play 3 times
    // currentRepeatCount: 0 → first play, 1 → second play, 2 → third play
    // After third play (currentRepeatCount=2), should not repeat
    return this.currentRepeatCount < repeatCount - 1
  }

  /**
   * Handle repeat action
   * Always pauses for 1 second between repeats
   */
  private handleRepeat(event: SentenceEndEvent): TriggerAction {
    this.currentRepeatCount++

    return {
      type: 'REPEAT',
      seekTo: event.sentenceIndex,
      pauseDuration: REPEAT_PAUSE_DURATION, // Always 1 second
      repeatInfo: {
        current: this.currentRepeatCount + 1,
        total: this.config.repeatCount === -1 ? '∞' : this.config.repeatCount
      },
      debugMessage: `Repeating sentence ${event.sentenceIndex}: ${this.currentRepeatCount + 1}/${this.config.repeatCount === -1 ? '∞' : this.config.repeatCount} (1s pause)`
    }
  }

  /**
   * Handle advance to next sentence
   * Applies pause settings if configured
   */
  private handleAdvance(event: SentenceEndEvent): TriggerAction {
    const action: TriggerAction = {
      type: 'ADVANCE',
      seekTo: event.sentenceIndex + 1,
      pauseDuration: 0, // Default: no pause
      debugMessage: `Advancing to sentence ${event.sentenceIndex + 1}`
    }

    // Apply pause settings
    if (this.config.pauseAfterSentence) {
      if (this.config.autoResume) {
        action.pauseDuration = this.config.pauseDuration * 1000
        action.debugMessage += ` (auto-resume after ${this.config.pauseDuration}s)`
      } else {
        action.pauseDuration = -1 // -1 means manual resume (wait for user action)
        action.debugMessage += ' (manual pause - press space to continue)'
      }
    }

    return action
  }

  /**
   * Handle playback completion (last sentence finished)
   */
  private handleComplete(_event: SentenceEndEvent): TriggerAction {
    return {
      type: 'COMPLETE',
      seekTo: null,
      pauseDuration: 0,
      debugMessage: 'Playback completed'
    }
  }

  /**
   * Reset manager state (called when sentence changes externally)
   */
  reset(newSentenceIndex?: number) {
    if (newSentenceIndex !== undefined) {
      this.currentSentenceIndex = newSentenceIndex
    }
    this.currentRepeatCount = 0
  }

  /**
   * Update configuration (allows real-time config changes)
   */
  updateConfig(config: Partial<TriggerConfig>) {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current state (for debugging)
   */
  getState() {
    return {
      currentRepeatCount: this.currentRepeatCount,
      currentSentenceIndex: this.currentSentenceIndex,
      config: this.config
    }
  }

  /**
   * Get repeat display info (for UI)
   */
  getRepeatInfo() {
    if (this.config.repeatCount === 1 || this.currentRepeatCount === 0) {
      return null
    }

    return {
      current: this.currentRepeatCount + 1,
      total: this.config.repeatCount === -1 ? '∞' : this.config.repeatCount
    }
  }
}
