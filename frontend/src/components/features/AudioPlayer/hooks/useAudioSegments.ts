/**
 * useAudioSegments Hook
 *
 * Manages audio segments in separated audio mode.
 * Handles segment switching, blob URL creation/cleanup, and preloading.
 *
 * This is the core hook for the new separated audio architecture where
 * each sentence has its own audio file instead of one concatenated file.
 */

import { useState, useEffect, RefObject, useCallback } from 'react'
import { SegmentState } from '../types'

interface UseAudioSegmentsOptions {
  audioRef: RefObject<HTMLAudioElement>
  audioSegments?: Blob[]
  segmentDurations?: number[]
  externalSentenceIndex?: number
  onSegmentChange?: (index: number) => void
}

export function useAudioSegments({
  audioRef,
  audioSegments,
  segmentDurations,
  externalSentenceIndex,
  onSegmentChange,
}: UseAudioSegmentsOptions) {
  const [segmentState, setSegmentState] = useState<SegmentState>({
    segments: [],
    durations: [],
    currentIndex: 0,
    totalDuration: 0,
    isSegmentMode: false,
  })

  // Initialize: Create blob URLs from blobs
  useEffect(() => {
    console.log('[useAudioSegments] Initializing with', audioSegments?.length, 'segments')

    if (!audioSegments || audioSegments.length === 0) {
      setSegmentState({
        segments: [],
        durations: [],
        currentIndex: 0,
        totalDuration: 0,
        isSegmentMode: false,
      })
      return
    }

    // Create blob URLs
    const urls = audioSegments.map(blob => URL.createObjectURL(blob))
    const totalDur = (segmentDurations || []).reduce((a, b) => a + b, 0)

    // Use externalSentenceIndex if provided, otherwise default to 0
    const initialIndex = externalSentenceIndex !== undefined
      ? Math.min(Math.max(0, externalSentenceIndex), urls.length - 1)
      : 0

    console.log('[useAudioSegments] Created', urls.length, 'blob URLs')
    console.log('[useAudioSegments] Total duration:', totalDur, 'seconds')
    console.log('[useAudioSegments] Initial index:', initialIndex)

    setSegmentState({
      segments: urls,
      durations: segmentDurations || [],
      currentIndex: initialIndex,
      totalDuration: totalDur,
      isSegmentMode: true,
    })

    // Load initial segment (use externalSentenceIndex if provided)
    if (audioRef.current && urls[initialIndex]) {
      console.log('[useAudioSegments] Loading segment', initialIndex)
      audioRef.current.src = urls[initialIndex]
      audioRef.current.load()
    }

    // Cleanup: Revoke blob URLs when component unmounts or segments change
    return () => {
      console.log('[useAudioSegments] Cleaning up', urls.length, 'blob URLs')
      urls.forEach(url => URL.revokeObjectURL(url))
    }
  }, [audioSegments, segmentDurations, externalSentenceIndex])

  /**
   * Switch to a specific segment by index
   */
  const switchToSegment = useCallback(
    async (index: number, autoPlay: boolean = false) => {
      if (index < 0 || index >= segmentState.segments.length) {
        console.warn('[useAudioSegments] Invalid segment index:', index)
        return
      }

      // For repeat, we need to reload even if it's the same segment
      const isSameSegment = index === segmentState.currentIndex
      if (isSameSegment && !autoPlay) {
        console.log('[useAudioSegments] Already on segment', index, 'and autoPlay is false')
        return
      }

      console.log('[useAudioSegments] Switching to segment', index, isSameSegment ? '(repeat)' : '')

      setSegmentState(prev => ({ ...prev, currentIndex: index }))

      if (audioRef.current && segmentState.segments[index]) {
        const wasPlaying = !audioRef.current.paused
        const currentSpeed = audioRef.current.playbackRate // Save current speed

        // Set new source
        audioRef.current.src = segmentState.segments[index]
        audioRef.current.load()

        // Wait for loadeddata event
        await new Promise<void>((resolve) => {
          const handleLoadedData = () => {
            audioRef.current?.removeEventListener('loadeddata', handleLoadedData)
            resolve()
          }
          audioRef.current?.addEventListener('loadeddata', handleLoadedData)
        })

        // Restore playback speed
        if (audioRef.current) {
          audioRef.current.playbackRate = currentSpeed
          console.log('[useAudioSegments] Restored playback speed to', currentSpeed)
        }

        // Resume playback if it was playing, or if autoPlay is true
        if (wasPlaying || autoPlay) {
          try {
            await audioRef.current.play()
            console.log('[useAudioSegments] Resumed playback on segment', index)
          } catch (error) {
            console.error('[useAudioSegments] Failed to resume playback:', error)
          }
        }

        // Notify parent
        onSegmentChange?.(index)
      }
    },
    [segmentState.segments, segmentState.currentIndex, audioRef, onSegmentChange]
  )

  /**
   * Preload next segment for smoother transitions
   */
  const preloadNextSegment = useCallback(() => {
    const nextIndex = segmentState.currentIndex + 1
    if (nextIndex < segmentState.segments.length) {
      console.log('[useAudioSegments] Preloading segment', nextIndex)
      const nextAudio = new Audio(segmentState.segments[nextIndex])
      nextAudio.preload = 'auto'
    }
  }, [segmentState.currentIndex, segmentState.segments])

  /**
   * Handle segment ended event
   * This should be called from the parent component's onEnded handler
   */
  const handleSegmentEnded = useCallback(() => {
    console.log('[useAudioSegments] Segment', segmentState.currentIndex, 'ended')
    return {
      currentIndex: segmentState.currentIndex,
      hasNext: segmentState.currentIndex < segmentState.segments.length - 1,
    }
  }, [segmentState.currentIndex, segmentState.segments.length])

  return {
    segmentState,
    switchToSegment,
    preloadNextSegment,
    handleSegmentEnded,
    hasNextSegment: segmentState.currentIndex < segmentState.segments.length - 1,
    hasPrevSegment: segmentState.currentIndex > 0,
    isSegmentMode: segmentState.isSegmentMode,
  }
}
