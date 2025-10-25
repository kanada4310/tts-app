/**
 * useRepeatControl Hook
 *
 * Manages repeat count, current repeat iteration, and auto-advance settings.
 * Used for repeating individual sentences multiple times before moving to the next.
 */

import { useState, useCallback } from 'react'
import { RepeatState } from '../types'

export function useRepeatControl() {
  const [repeatState, setRepeatState] = useState<RepeatState>({
    count: 1, // 1 (no repeat), 3, 5, -1 (infinite)
    current: 0,
    autoAdvance: true,
    autoPauseAfterSentence: false,
  })

  /**
   * Set the repeat count (1, 3, 5, or -1 for infinite)
   */
  const setRepeatCount = useCallback((count: number) => {
    console.log('[useRepeatControl] Setting repeat count to', count)
    setRepeatState(prev => ({ ...prev, count, current: 0 }))
  }, [])

  /**
   * Increment the current repeat counter
   */
  const incrementRepeat = useCallback(() => {
    setRepeatState(prev => {
      const newCurrent = prev.current + 1
      console.log('[useRepeatControl] Incrementing repeat:', newCurrent, '/', prev.count === -1 ? '∞' : prev.count)
      return { ...prev, current: newCurrent }
    })
  }, [])

  /**
   * Reset the current repeat counter to 0
   */
  const resetRepeat = useCallback(() => {
    console.log('[useRepeatControl] Resetting repeat counter')
    setRepeatState(prev => ({ ...prev, current: 0 }))
  }, [])

  /**
   * Check if the current sentence should be repeated again
   */
  const shouldRepeat = useCallback((): boolean => {
    const { count, current } = repeatState

    // Infinite repeat
    if (count === -1) {
      return true
    }

    // No repeat (count = 1)
    if (count === 1) {
      return false
    }

    // Check if we haven't reached the repeat count yet
    const shouldContinue = current < count - 1
    console.log('[useRepeatControl] Should repeat?', shouldContinue, `(${current + 1}/${count})`)
    return shouldContinue
  }, [repeatState])

  /**
   * Set the auto-advance setting
   * If true, automatically move to next sentence after repeats complete
   */
  const setAutoAdvance = useCallback((value: boolean) => {
    console.log('[useRepeatControl] Setting auto-advance to', value)
    setRepeatState(prev => ({ ...prev, autoAdvance: value }))
  }, [])

  /**
   * Set the auto-pause after sentence setting
   * If true, pause after each sentence for user practice
   */
  const setAutoPauseAfterSentence = useCallback((value: boolean) => {
    console.log('[useRepeatControl] Setting auto-pause after sentence to', value)
    setRepeatState(prev => ({ ...prev, autoPauseAfterSentence: value }))
  }, [])

  /**
   * Get formatted repeat display text (e.g., "2/3" or "5/∞")
   */
  const getRepeatDisplayText = useCallback((): string => {
    const { count, current } = repeatState
    if (count === 1) return '' // No repeat, no display
    if (count === -1) return `${current + 1}/∞`
    return `${current + 1}/${count}`
  }, [repeatState])

  return {
    repeatState,
    setRepeatCount,
    incrementRepeat,
    resetRepeat,
    shouldRepeat,
    setAutoAdvance,
    setAutoPauseAfterSentence,
    getRepeatDisplayText,
  }
}
