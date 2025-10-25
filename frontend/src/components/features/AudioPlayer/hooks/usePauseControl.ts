/**
 * usePauseControl Hook
 *
 * Manages pause settings between sentences.
 * Allows users to configure automatic pauses for practice/shadowing.
 */

import { useState, useRef, useCallback } from 'react'
import { PauseSettings } from '../types'

export function usePauseControl() {
  const [pauseSettings, setPauseSettings] = useState<PauseSettings>({
    enabled: false,
    duration: 1.0, // seconds
  })

  const [isPauseBetweenSentences, setIsPauseBetweenSentences] = useState(false)
  const pauseTimeoutRef = useRef<number | null>(null)

  /**
   * Set pause enabled/disabled
   */
  const setPauseEnabled = useCallback((enabled: boolean) => {
    console.log('[usePauseControl] Setting pause enabled to', enabled)
    setPauseSettings(prev => ({ ...prev, enabled }))
  }, [])

  /**
   * Set pause duration (in seconds, 0-5)
   */
  const setPauseDuration = useCallback((duration: number) => {
    const clampedDuration = Math.max(0, Math.min(5, duration))
    console.log('[usePauseControl] Setting pause duration to', clampedDuration, 'seconds')
    setPauseSettings(prev => ({ ...prev, duration: clampedDuration }))
  }, [])

  /**
   * Apply a pause before executing a callback
   * If pause is disabled, the callback is executed immediately
   */
  const applyPause = useCallback(
    async (callback: () => void) => {
      if (!pauseSettings.enabled || pauseSettings.duration === 0) {
        console.log('[usePauseControl] Pause disabled or duration 0, executing immediately')
        callback()
        return
      }

      console.log('[usePauseControl] Applying', pauseSettings.duration, 'second pause')
      setIsPauseBetweenSentences(true)

      pauseTimeoutRef.current = window.setTimeout(() => {
        console.log('[usePauseControl] Pause complete, executing callback')
        setIsPauseBetweenSentences(false)
        pauseTimeoutRef.current = null
        callback()
      }, pauseSettings.duration * 1000)
    },
    [pauseSettings]
  )

  /**
   * Cancel any active pause and execute callback immediately
   */
  const cancelPause = useCallback(() => {
    if (pauseTimeoutRef.current) {
      console.log('[usePauseControl] Cancelling active pause')
      clearTimeout(pauseTimeoutRef.current)
      pauseTimeoutRef.current = null
    }
    setIsPauseBetweenSentences(false)
  }, [])

  /**
   * Cleanup on unmount
   */
  const cleanup = useCallback(() => {
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current)
      pauseTimeoutRef.current = null
    }
  }, [])

  return {
    pauseSettings,
    setPauseEnabled,
    setPauseDuration,
    isPauseBetweenSentences,
    applyPause,
    cancelPause,
    cleanup,
  }
}
