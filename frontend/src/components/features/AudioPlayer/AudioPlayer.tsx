/**
 * AudioPlayer Component (Refactored)
 *
 * Hooks-based architecture for separated audio mode.
 * Each sentence has its own audio file, enabling perfect repeat functionality.
 */

import { useRef, useState, useCallback } from 'react'
import { AudioPlayerProps } from './types'
import {
  useAudioPlayback,
  useAudioSegments,
  useSentenceNavigation,
  useRepeatControl,
  usePauseControl,
  useKeyboardShortcuts,
} from './hooks'
import {
  PlaybackControls,
  ProgressBar,
  SentenceControls,
  SpeedSettings,
  RepeatSettings,
  ShortcutsHelp,
} from './components'
import { SentenceList } from '../SentenceList/SentenceList'
import './styles.css'

export function AudioPlayer({
  audioUrl,
  audioSegments,
  segmentDurations,
  sourceText,
  sourceSentences,
  onPlaybackComplete,
  onSentenceChange,
  onPlayStateChange,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [showShortcuts, setShowShortcuts] = useState(false)

  // ========================================
  // Custom Hooks
  // ========================================

  const { playbackState, play, pause, setSpeed, seek } = useAudioPlayback({
    audioRef,
    onPlay: () => onPlayStateChange?.(true),
    onPause: () => onPlayStateChange?.(false),
  })

  const {
    segmentState,
    switchToSegment,
    handleSegmentEnded: getSegmentEndedInfo,
    hasNextSegment,
    hasPrevSegment,
    isSegmentMode,
  } = useAudioSegments({
    audioRef,
    audioSegments,
    segmentDurations,
    onSegmentChange: onSentenceChange,
  })

  const {
    repeatState,
    setRepeatCount,
    incrementRepeat,
    resetRepeat,
    shouldRepeat,
    setAutoAdvance,
    setAutoPauseAfterSentence,
    getRepeatDisplayText,
  } = useRepeatControl()

  const { pauseSettings, applyPause } = usePauseControl()

  const { goToPrevSentence, goToNextSentence } = useSentenceNavigation({
    currentIndex: segmentState.currentIndex,
    totalSentences: sourceSentences?.length || 0,
    onSentenceChange: (index) => {
      onSentenceChange?.(index)
    },
    switchToSegment,
    isSegmentMode,
  })

  // ========================================
  // Stop Function
  // ========================================

  const stop = useCallback(() => {
    pause()
    if (audioRef.current) {
      audioRef.current.currentTime = 0
    }
    // Reset to first segment if in segment mode
    if (isSegmentMode) {
      switchToSegment(0, false)
    }
  }, [pause, audioRef, isSegmentMode, switchToSegment])

  // ========================================
  // Segment Ended Handler (Core Logic)
  // ========================================

  const handleSegmentEnded = useCallback(async () => {
    console.log('[AudioPlayer] Segment ended')
    const { currentIndex, hasNext } = getSegmentEndedInfo()

    // Check if should repeat
    if (shouldRepeat()) {
      console.log('[AudioPlayer] Repeating segment', currentIndex)
      incrementRepeat()

      // Apply pause if enabled
      if (pauseSettings.enabled) {
        await applyPause(async () => {
          await switchToSegment(currentIndex, true)
        })
      } else {
        await switchToSegment(currentIndex, true)
      }
    } else {
      // Reset repeat counter
      resetRepeat()

      // Check if should pause after sentence (for practice)
      if (repeatState.autoPauseAfterSentence) {
        console.log('[AudioPlayer] Auto-pausing after sentence for practice')
        pause()
        return
      }

      // Check if should auto-advance
      if (repeatState.autoAdvance && hasNext) {
        console.log('[AudioPlayer] Auto-advancing to next segment')

        // Apply pause if enabled
        if (pauseSettings.enabled) {
          await applyPause(async () => {
            await switchToSegment(currentIndex + 1, true)
          })
        } else {
          await switchToSegment(currentIndex + 1, true)
        }
      } else {
        // Stop playback
        console.log('[AudioPlayer] Playback complete')
        pause()
        onPlaybackComplete?.()
      }
    }
  }, [
    getSegmentEndedInfo,
    shouldRepeat,
    incrementRepeat,
    resetRepeat,
    repeatState.autoAdvance,
    repeatState.autoPauseAfterSentence,
    pauseSettings.enabled,
    applyPause,
    switchToSegment,
    pause,
    onPlaybackComplete,
  ])

  // ========================================
  // Speed Control Helpers
  // ========================================

  const increaseSpeed = useCallback(() => {
    const newSpeed = Math.min(2.0, playbackState.speed + 0.25)
    setSpeed(newSpeed)
  }, [playbackState.speed, setSpeed])

  const decreaseSpeed = useCallback(() => {
    const newSpeed = Math.max(0.25, playbackState.speed - 0.25)
    setSpeed(newSpeed)
  }, [playbackState.speed, setSpeed])

  const toggleShortcutsHelp = useCallback(() => {
    setShowShortcuts((prev) => !prev)
  }, [])

  // ========================================
  // Keyboard Shortcuts
  // ========================================

  useKeyboardShortcuts({
    isPlaying: playbackState.isPlaying,
    play,
    pause,
    goToPrevSentence,
    goToNextSentence,
    increaseSpeed,
    decreaseSpeed,
    toggleShortcutsHelp,
    enabled: !showShortcuts, // Disable when help is shown
  })

  // ========================================
  // Render
  // ========================================

  if (!audioUrl && !isSegmentMode) {
    return null
  }

  return (
    <div className="audio-player">
      {/* Hidden Audio Element */}
      <audio ref={audioRef} onEnded={handleSegmentEnded} />

      {/* Playback Controls (Play/Pause/Stop only) */}
      <PlaybackControls
        isPlaying={playbackState.isPlaying}
        isLoading={playbackState.isLoading}
        onPlay={play}
        onPause={pause}
        onStop={stop}
      />

      {/* Progress Bar */}
      <ProgressBar
        currentTime={playbackState.currentTime}
        duration={
          isSegmentMode
            ? segmentState.durations[segmentState.currentIndex] || 0
            : playbackState.duration
        }
        onSeek={seek}
        isSegmentMode={isSegmentMode}
        segmentDurations={segmentState.durations}
        currentSegmentIndex={segmentState.currentIndex}
        sourceSentences={sourceSentences}
        onSegmentSeek={switchToSegment}
      />

      {/* Sentence Navigation (Skip buttons) */}
      {isSegmentMode && (
        <SentenceControls
          currentIndex={segmentState.currentIndex}
          totalSentences={sourceSentences?.length || 0}
          onPrev={goToPrevSentence}
          onNext={goToNextSentence}
          hasPrev={hasPrevSegment}
          hasNext={hasNextSegment}
        />
      )}

      {/* Speed Settings (Collapsible) */}
      <SpeedSettings speed={playbackState.speed} onSpeedChange={setSpeed} />

      {/* Repeat Settings (Collapsible) */}
      {isSegmentMode && (
        <RepeatSettings
          repeatCount={repeatState.count}
          autoAdvance={repeatState.autoAdvance}
          autoPauseAfterSentence={repeatState.autoPauseAfterSentence}
          onRepeatCountChange={setRepeatCount}
          onAutoAdvanceChange={setAutoAdvance}
          onAutoPauseChange={setAutoPauseAfterSentence}
          getRepeatDisplayText={getRepeatDisplayText}
        />
      )}

      {/* Sentence List (Collapsible) */}
      {isSegmentMode && sourceSentences && sourceSentences.length > 0 && (
        <SentenceList
          sentences={sourceSentences}
          sentenceTimings={[]}
          currentSentenceIndex={segmentState.currentIndex}
          isPlaying={playbackState.isPlaying}
          onSentenceClick={(index) => switchToSegment(index, false)}
          materialText={sourceText || ''}
        />
      )}

      {/* Shortcuts Help Modal */}
      <ShortcutsHelp visible={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  )
}

export type { AudioPlayerProps }
