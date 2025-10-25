/**
 * useKeyboardShortcuts Hook
 *
 * Handles keyboard shortcuts for audio player controls.
 * Shortcuts are disabled when typing in input/textarea fields.
 */

import { useEffect, useCallback } from 'react'

interface UseKeyboardShortcutsOptions {
  isPlaying: boolean
  play: () => void
  pause: () => void
  goToPrevSentence: () => void
  goToNextSentence: () => void
  increaseSpeed: () => void
  decreaseSpeed: () => void
  toggleShortcutsHelp: () => void
  enabled?: boolean
}

export function useKeyboardShortcuts({
  isPlaying,
  play,
  pause,
  goToPrevSentence,
  goToNextSentence,
  increaseSpeed,
  decreaseSpeed,
  toggleShortcutsHelp,
  enabled = true,
}: UseKeyboardShortcutsOptions) {
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if shortcuts are disabled
      if (!enabled) return

      // Ignore if typing in input/textarea
      const target = e.target as HTMLElement
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable
      ) {
        return
      }

      let handled = false

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          // Space or K: Toggle play/pause
          e.preventDefault()
          if (isPlaying) {
            pause()
          } else {
            play()
          }
          handled = true
          break

        case 'arrowleft':
          // Left arrow: Previous sentence
          e.preventDefault()
          goToPrevSentence()
          handled = true
          break

        case 'arrowright':
          // Right arrow: Next sentence
          e.preventDefault()
          goToNextSentence()
          handled = true
          break

        case 'arrowup':
          // Up arrow: Increase speed
          e.preventDefault()
          increaseSpeed()
          handled = true
          break

        case 'arrowdown':
          // Down arrow: Decrease speed
          e.preventDefault()
          decreaseSpeed()
          handled = true
          break

        case '?':
          // ?: Show shortcuts help
          e.preventDefault()
          toggleShortcutsHelp()
          handled = true
          break

        default:
          break
      }

      if (handled) {
        console.log('[useKeyboardShortcuts] Handled key:', e.key)
      }
    },
    [
      enabled,
      isPlaying,
      play,
      pause,
      goToPrevSentence,
      goToNextSentence,
      increaseSpeed,
      decreaseSpeed,
      toggleShortcutsHelp,
    ]
  )

  useEffect(() => {
    if (!enabled) return

    console.log('[useKeyboardShortcuts] Registering keyboard shortcuts')
    window.addEventListener('keydown', handleKeyPress)

    return () => {
      console.log('[useKeyboardShortcuts] Unregistering keyboard shortcuts')
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [enabled, handleKeyPress])

  return {
    enabled,
  }
}
