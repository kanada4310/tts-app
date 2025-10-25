/**
 * useSentenceNavigation Hook
 *
 * Handles navigation between sentences (previous/next/goto).
 * In separated audio mode, this works with useAudioSegments to switch segments.
 */

import { useCallback } from 'react'

interface UseSentenceNavigationOptions {
  currentIndex: number
  totalSentences: number
  onSentenceChange: (index: number) => void
  switchToSegment?: (index: number, autoPlay?: boolean) => Promise<void>
  isSegmentMode: boolean
}

export function useSentenceNavigation({
  currentIndex,
  totalSentences,
  onSentenceChange,
  switchToSegment,
  isSegmentMode,
}: UseSentenceNavigationOptions) {
  /**
   * Go to the previous sentence
   */
  const goToPrevSentence = useCallback(async () => {
    if (currentIndex <= 0) {
      console.log('[useSentenceNavigation] Already at first sentence')
      return
    }

    const prevIndex = currentIndex - 1
    console.log('[useSentenceNavigation] Going to previous sentence:', prevIndex)

    onSentenceChange(prevIndex)

    // In separated audio mode, switch to the previous segment
    if (isSegmentMode && switchToSegment) {
      await switchToSegment(prevIndex, true)
    }
  }, [currentIndex, onSentenceChange, switchToSegment, isSegmentMode])

  /**
   * Go to the next sentence
   */
  const goToNextSentence = useCallback(async () => {
    if (currentIndex >= totalSentences - 1) {
      console.log('[useSentenceNavigation] Already at last sentence')
      return
    }

    const nextIndex = currentIndex + 1
    console.log('[useSentenceNavigation] Going to next sentence:', nextIndex)

    onSentenceChange(nextIndex)

    // In separated audio mode, switch to the next segment
    if (isSegmentMode && switchToSegment) {
      await switchToSegment(nextIndex, true)
    }
  }, [currentIndex, totalSentences, onSentenceChange, switchToSegment, isSegmentMode])

  /**
   * Go to a specific sentence by index
   */
  const goToSentence = useCallback(
    async (index: number) => {
      if (index < 0 || index >= totalSentences) {
        console.warn('[useSentenceNavigation] Invalid sentence index:', index)
        return
      }

      console.log('[useSentenceNavigation] Going to sentence:', index)

      onSentenceChange(index)

      // In separated audio mode, switch to the specified segment
      if (isSegmentMode && switchToSegment) {
        await switchToSegment(index, true)
      }
    },
    [totalSentences, onSentenceChange, switchToSegment, isSegmentMode]
  )

  return {
    goToPrevSentence,
    goToNextSentence,
    goToSentence,
    hasPrev: currentIndex > 0,
    hasNext: currentIndex < totalSentences - 1,
  }
}
