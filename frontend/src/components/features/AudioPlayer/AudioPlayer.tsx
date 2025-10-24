/**
 * AudioPlayer Component
 *
 * Plays audio with pitch-preserving speed control using HTML5 Audio API
 * Extended features:
 * - Sentence-by-sentence navigation
 * - Pause insertion between sentences
 * - Seekbar with sentence boundary markers
 * - Seekbar tooltips showing sentence preview
 */

import { useState, useEffect, useRef, useMemo } from 'react'
import { AUDIO_CONFIG, PAUSE_CONFIG } from '@/constants/audio'
import { MESSAGES } from '@/constants/messages'
import { detectSentences, extractFirstWords, estimateTimestamp } from '@/utils/textAnalysis'
import { SentenceTriggerManager, TriggerConfig, TriggerAction } from '@/utils/sentenceTriggerManager'
import type { SentenceBoundary, PauseConfig } from '@/types/audio'
import type { SentenceTiming } from '@/types/api'
import './styles.css'

export interface AudioPlayerProps {
  audioUrl: string | null
  sourceText?: string // The original OCR text for fallback
  sourceSentences?: string[] // Pre-parsed sentences from backend
  sentenceTimings?: SentenceTiming[] // Precise timings from TTS (LEGACY - not used in separated mode)
  audioSegments?: Blob[] // NEW: Separated audio blobs (one per sentence)
  segmentDurations?: number[] // NEW: Duration of each segment
  externalSentenceIndex?: number // External sentence index from SentenceList clicks
  onPlaybackComplete?: () => void
  onSentenceChange?: (index: number) => void // Callback when sentence changes
  onPlayStateChange?: (isPlaying: boolean) => void // Callback when play state changes
}

export function AudioPlayer({
  audioUrl,
  sourceText,
  sourceSentences,
  sentenceTimings,
  audioSegments,
  segmentDurations,
  externalSentenceIndex,
  onPlaybackComplete,
  onSentenceChange,
  onPlayStateChange
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeed] = useState<number>(AUDIO_CONFIG.SPEED_DEFAULT)
  const [isLoading, setIsLoading] = useState(false)
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0)
  const [isPauseBetweenSentences, setIsPauseBetweenSentences] = useState(false)
  const [pauseConfig, setPauseConfig] = useState<PauseConfig>({
    enabled: false,
    duration: PAUSE_CONFIG.DEFAULT
  })
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState(0)
  const [tooltipText, setTooltipText] = useState('')

  // Touch/drag state for seekbar sliding
  const [isDragging, setIsDragging] = useState(false)

  // Repeat playback settings
  const [repeatCount, setRepeatCount] = useState<number>(1) // 1, 3, 5, or -1 (infinite)
  const [currentRepeat, setCurrentRepeat] = useState<number>(0)
  const [autoAdvance, setAutoAdvance] = useState<boolean>(true)

  // Auto-pause after sentence
  const [autoPauseAfterSentence, setAutoPauseAfterSentence] = useState<boolean>(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const intervalRef = useRef<number | null>(null)
  const pauseTimeoutRef = useRef<number | null>(null)
  const progressBarRef = useRef<HTMLDivElement | null>(null)
  const [showShortcuts, setShowShortcuts] = useState(false)

  // Centralized trigger manager
  const triggerManagerRef = useRef<SentenceTriggerManager | null>(null)

  // Track which sentence endings we've already processed
  const processedSentenceEndsRef = useRef<Set<number>>(new Set())

  // Track when we last seeked (to prevent detection immediately after seek)
  const lastSeekTimeRef = useRef<number>(0)

  // Track if we're currently processing an action (to prevent multiple simultaneous triggers)
  const isProcessingActionRef = useRef<boolean>(false)

  // Parse sentences from backend or fallback to client-side detection
  const sentences: SentenceBoundary[] = useMemo(() => {
    if (!duration) return []

    // Priority 1: Use precise timings from TTS backend (most accurate)
    if (sentenceTimings && sentenceTimings.length > 0) {
      console.log('[AudioPlayer] Using sentenceTimings from backend:', sentenceTimings.length, 'sentences')
      let currentIndex = 0
      const result = sentenceTimings.map((timing, idx) => {
        const startIndex = currentIndex
        const endIndex = currentIndex + timing.text.length
        currentIndex = endIndex + 1 // +1 for space between sentences

        const sentence = {
          text: timing.text,
          startIndex,
          endIndex,
          timestamp: timing.start_time, // Use precise timestamp from TTS
          preview: extractFirstWords(timing.text, 7)
        }

        if (idx < 3) {
          console.log(`[AudioPlayer] Sentence ${idx}: timestamp=${timing.start_time.toFixed(3)}s, duration=${timing.duration.toFixed(3)}s, text="${timing.text.substring(0, 30)}..."`)
        }

        return sentence
      })
      return result
    }

    // Priority 2: Use backend-provided sentences with estimated timestamps
    if (sourceSentences && sourceSentences.length > 0) {
      let currentIndex = 0
      return sourceSentences.map((sentenceText) => {
        const startIndex = currentIndex
        const endIndex = currentIndex + sentenceText.length
        currentIndex = endIndex + 1 // +1 for space between sentences

        return {
          text: sentenceText,
          startIndex,
          endIndex,
          timestamp: estimateTimestamp(startIndex, sourceText?.length || 1, duration),
          preview: extractFirstWords(sentenceText, 7)
        }
      })
    }

    // Priority 3: Fallback to client-side detection if no backend sentences
    if (!sourceText) return []

    const parsedSentences = detectSentences(sourceText)

    return parsedSentences.map((sentence) => ({
      text: sentence.text,
      startIndex: sentence.startIndex,
      endIndex: sentence.endIndex,
      timestamp: estimateTimestamp(sentence.startIndex, sourceText.length, duration),
      preview: extractFirstWords(sentence.text, 7)
    }))
  }, [sourceText, sourceSentences, sentenceTimings, duration])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault()
          if (isPlaying) {
            handlePause()
          } else {
            handlePlay()
          }
          break
        case 'arrowleft':
          e.preventDefault()
          handlePreviousSentence()
          break
        case 'arrowright':
          e.preventDefault()
          handleNextSentence()
          break
        case 'arrowup':
          e.preventDefault()
          handleSpeedChange(Math.min(AUDIO_CONFIG.SPEED_MAX, speed + AUDIO_CONFIG.SPEED_STEP))
          break
        case 'arrowdown':
          e.preventDefault()
          handleSpeedChange(Math.max(AUDIO_CONFIG.SPEED_MIN, speed - AUDIO_CONFIG.SPEED_STEP))
          break
        case '?':
          e.preventDefault()
          setShowShortcuts(!showShortcuts)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isPlaying, speed, showShortcuts])

  // Initialize trigger manager when config changes
  useEffect(() => {
    const config: TriggerConfig = {
      repeatCount,
      // pauseAfterSentence: true if either pause feature is enabled
      pauseAfterSentence: pauseConfig.enabled || autoPauseAfterSentence,
      // autoResume: true only if "pause between sentences" is enabled (not manual pause)
      autoResume: pauseConfig.enabled,
      pauseDuration: pauseConfig.duration,
      autoAdvance
    }

    if (!triggerManagerRef.current) {
      triggerManagerRef.current = new SentenceTriggerManager(config)
    } else {
      triggerManagerRef.current.updateConfig(config)
    }
  }, [repeatCount, autoPauseAfterSentence, pauseConfig.enabled, pauseConfig.duration, autoAdvance])

  // Load audio when URL changes
  useEffect(() => {
    if (!audioUrl) {
      cleanupPlayer()
      return
    }

    loadAudio(audioUrl)

    return () => {
      cleanupPlayer()
    }
  }, [audioUrl])

  // Update playback rate when speed changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed
    }
  }, [speed])

  // Keep tooltip visible while dragging
  useEffect(() => {
    if (isDragging) {
      setTooltipVisible(true)
    }
  }, [isDragging])

  // Handle external sentence index changes (from SentenceList clicks)
  useEffect(() => {
    if (externalSentenceIndex !== undefined &&
        externalSentenceIndex !== currentSentenceIndex &&
        audioRef.current &&
        sentences.length > 0 &&
        externalSentenceIndex >= 0 &&
        externalSentenceIndex < sentences.length) {

      const targetSentence = sentences[externalSentenceIndex]
      console.log(`[AudioPlayer] Seeking to sentence ${externalSentenceIndex} at ${targetSentence.timestamp}s`)

      // Seek to the sentence
      audioRef.current.currentTime = targetSentence.timestamp
      setCurrentSentenceIndex(externalSentenceIndex)
      setCurrentRepeat(0) // Reset repeat count

      // Reset trigger manager and clear tracking
      if (triggerManagerRef.current) {
        triggerManagerRef.current.reset(externalSentenceIndex)
      }
      processedSentenceEndsRef.current.clear()

      // Start playing if not already playing
      if (!isPlaying) {
        audioRef.current.play()
        setIsPlaying(true)
        onPlayStateChange?.(true)
      }
    }
  }, [externalSentenceIndex, sentences])

  // Track current sentence and detect sentence end
  useEffect(() => {
    if (sentences.length === 0 || !audioRef.current || !triggerManagerRef.current) return

    // Find current sentence index based on playback time
    const index = sentences.findIndex((sentence, i) => {
      const nextSentence = sentences[i + 1]
      return currentTime >= sentence.timestamp &&
             (!nextSentence || currentTime < nextSentence.timestamp)
    })

    // Update current sentence index
    if (index !== -1 && index !== currentSentenceIndex) {
      setCurrentSentenceIndex(index)
      onSentenceChange?.(index)
    }

    // Detect sentence END (only when playing and not in pause state)
    // IMPORTANT: Also check that we're not pending a pause timeout
    // AND that enough time has passed since last seek (300ms grace period)
    // AND that we're not already processing another action
    const timeSinceLastSeek = Date.now() - lastSeekTimeRef.current
    if (isPlaying && index !== -1 && !isPauseBetweenSentences && !pauseTimeoutRef.current && timeSinceLastSeek > 300 && !isProcessingActionRef.current) {
      const currentSentence = sentences[index]
      const nextSentence = sentences[index + 1]

      // Calculate sentence end time
      let sentenceEndTime: number
      if (nextSentence) {
        sentenceEndTime = nextSentence.timestamp
      } else {
        // Last sentence: use timestamp + duration (or estimate)
        const timing = sentenceTimings?.find((_, i) => i === index)
        sentenceEndTime = timing
          ? currentSentence.timestamp + timing.duration
          : currentSentence.timestamp + 3.0 // Fallback: 3 seconds
      }

      // Detect when we're near the end (progress >= 95%)
      // This is more reliable than time-based detection (0.1s window)
      const sentenceDuration = sentenceEndTime - currentSentence.timestamp
      const progressIntoSentence = currentTime - currentSentence.timestamp
      const progressRatio = progressIntoSentence / sentenceDuration

      // Detection window: 95% - 100% (NOT beyond 100%)
      // Only detect if we're in the current sentence's time range
      if (progressRatio >= 0.95 && progressRatio < 1.0) {
        // Check if we've already processed this sentence end
        if (!processedSentenceEndsRef.current.has(index)) {
          processedSentenceEndsRef.current.add(index)

          // Mark as processing to block other simultaneous triggers
          isProcessingActionRef.current = true

          console.log(`[AudioPlayer] Sentence ${index} ending (${(progressRatio * 100).toFixed(1)}%), calling trigger manager...`)
          console.log(`[AudioPlayer] Timing: currentTime=${currentTime.toFixed(3)}s, sentenceStart=${currentSentence.timestamp.toFixed(3)}s, sentenceEnd=${sentenceEndTime.toFixed(3)}s`)

          const action = triggerManagerRef.current.handleSentenceEnd({
            sentenceIndex: index,
            totalSentences: sentences.length
          })

          console.log(`[AudioPlayer] Action decided: ${action.debugMessage}`)
          executeAction(action)
        }
      }
    }
  }, [currentTime, sentences, currentSentenceIndex, isPlaying, isPauseBetweenSentences, sentenceTimings, onSentenceChange])

  // Execute trigger action (redesigned)
  const executeAction = (action: TriggerAction) => {
    if (!audioRef.current) return

    // Update repeat info display
    if (action.repeatInfo) {
      setCurrentRepeat(action.repeatInfo.current - 1) // Convert to 0-based for display
    } else {
      setCurrentRepeat(0)
    }

    // Handle COMPLETE action (stop playback)
    if (action.type === 'COMPLETE') {
      audioRef.current.pause()
      setIsPlaying(false)
      onPlayStateChange?.(false)
      onPlaybackComplete?.()
      return
    }

    // Handle REPEAT or ADVANCE actions
    // Step 1: Pause immediately (if pauseDuration > 0 or -1)
    if (action.pauseDuration !== 0) {
      audioRef.current.pause()
      setIsPlaying(false)
      onPlayStateChange?.(false)
      setIsPauseBetweenSentences(true)

      // CRITICAL: Clear all processed flags immediately when pausing
      // This prevents other sentences in the 0.1s window from triggering during the pause
      processedSentenceEndsRef.current.clear()

      console.log(`[AudioPlayer] Paused for ${action.pauseDuration === -1 ? 'manual resume' : (action.pauseDuration / 1000) + 's'}, cleared all processed flags`)
    }

    // Step 2: Execute seek (for both REPEAT and ADVANCE)
    const executeSeek = () => {
      if (action.seekTo !== null && sentences.length > 0 && action.seekTo < sentences.length) {
        audioRef.current!.currentTime = sentences[action.seekTo].timestamp
        setCurrentSentenceIndex(action.seekTo)

        // Record seek time to prevent immediate detection
        lastSeekTimeRef.current = Date.now()

        console.log(`[AudioPlayer] Seeked to sentence ${action.seekTo} at ${sentences[action.seekTo].timestamp}s (grace period: 300ms)`)
      }
    }

    // Step 3: Schedule resume (or wait for manual resume)
    if (action.pauseDuration > 0) {
      // Auto-resume after specified duration
      pauseTimeoutRef.current = window.setTimeout(() => {
        executeSeek()

        if (audioRef.current) {
          audioRef.current.play().then(() => {
            setIsPlaying(true)
            onPlayStateChange?.(true)
            setIsPauseBetweenSentences(false)
            pauseTimeoutRef.current = null

            // Processing complete, allow new triggers
            isProcessingActionRef.current = false

            console.log(`[AudioPlayer] Auto-resumed after ${action.pauseDuration / 1000}s`)
          }).catch(err => {
            console.error('[AudioPlayer] Failed to resume playback:', err)
            setIsPauseBetweenSentences(false)
            pauseTimeoutRef.current = null
            isProcessingActionRef.current = false
          })
        }
      }, action.pauseDuration)
    } else if (action.pauseDuration === -1) {
      // Manual resume (wait for user to press space)
      executeSeek()
      console.log(`[AudioPlayer] Waiting for manual resume (press space)`)
      // Don't clear isProcessingActionRef yet - wait for user to resume
    } else {
      // No pause (pauseDuration === 0)
      executeSeek()

      // Processing complete immediately since there's no pause
      isProcessingActionRef.current = false
    }
  }

  const loadAudio = (url: string) => {
    setIsLoading(true)
    cleanupPlayer()

    try {
      const audio = new Audio(url)

      // Enable pitch preservation (supported in modern browsers)
      audio.preservesPitch = true
      // Fallback for older browsers
      ;(audio as any).mozPreservesPitch = true
      ;(audio as any).webkitPreservesPitch = true

      audio.preload = 'auto'

      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration)
        setIsLoading(false)
      })

      audio.addEventListener('error', (error) => {
        console.error('Error loading audio:', error)
        console.error('Audio error details:', {
          code: audio.error?.code,
          message: audio.error?.message,
          url: url,
          networkState: audio.networkState,
          readyState: audio.readyState
        })
        setIsLoading(false)
      })

      audio.addEventListener('ended', () => {
        handleAudioEnded()
      })

      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime)
      })

      audioRef.current = audio
    } catch (error) {
      console.error('Error creating audio player:', error)
      setIsLoading(false)
    }
  }

  const cleanupPlayer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current)
      pauseTimeoutRef.current = null
    }

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }

    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setIsPauseBetweenSentences(false)

    // Reset trigger manager and clear tracking
    if (triggerManagerRef.current) {
      triggerManagerRef.current.reset()
    }
    processedSentenceEndsRef.current.clear()
  }

  const handlePlay = async () => {
    if (!audioRef.current) return

    // Clear any pending auto-resume timeout
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current)
      pauseTimeoutRef.current = null
    }

    try {
      // If starting from the very beginning, clear all tracking
      if (audioRef.current.currentTime < 0.1) {
        console.log('[AudioPlayer] Starting playback from beginning, clearing all tracking')
        processedSentenceEndsRef.current.clear()
        if (triggerManagerRef.current) {
          triggerManagerRef.current.reset(0)
        }
        setCurrentSentenceIndex(0)
        setCurrentRepeat(0)
      }

      audioRef.current.playbackRate = speed
      await audioRef.current.play()
      setIsPlaying(true)
      onPlayStateChange?.(true)
      setIsPauseBetweenSentences(false)

      // If resuming from manual pause, allow new triggers
      isProcessingActionRef.current = false
    } catch (error) {
      console.error('Error playing audio:', error)
    }
  }

  const handlePause = () => {
    if (!audioRef.current) return

    // Clear any pending auto-resume timeout
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current)
      pauseTimeoutRef.current = null
    }

    audioRef.current.pause()
    setIsPlaying(false)
    onPlayStateChange?.(false)
    setIsPauseBetweenSentences(false)
  }

  const handleAudioEnded = () => {
    // This fires when the ENTIRE audio file ends
    // The SentenceTriggerManager handles per-sentence logic
    // We only need to handle the case where audio truly ends (e.g., user seeks to the very end)
    console.log('[AudioPlayer] Audio file ended')
    setIsPlaying(false)
    onPlayStateChange?.(false)
    onPlaybackComplete?.()
  }

  const handleStop = () => {
    if (!audioRef.current) return

    // Clear any pending auto-resume timeout
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current)
      pauseTimeoutRef.current = null
    }

    audioRef.current.pause()
    audioRef.current.currentTime = 0
    setIsPlaying(false)
    setCurrentTime(0)
    setCurrentSentenceIndex(0)
    setCurrentRepeat(0)
    setIsPauseBetweenSentences(false)

    // Reset trigger manager and clear tracking
    if (triggerManagerRef.current) {
      triggerManagerRef.current.reset(0)
    }
    processedSentenceEndsRef.current.clear()
  }

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed)
  }

  // Common logic to calculate seek position from client X coordinate
  const calculateSeekPosition = (clientX: number): number => {
    if (!progressBarRef.current || !audioRef.current) return 0

    const rect = progressBarRef.current.getBoundingClientRect()
    const offsetX = clientX - rect.left
    const percentage = Math.max(0, Math.min(1, offsetX / rect.width))
    return percentage * audioRef.current.duration
  }

  // Update tooltip based on position
  const updateTooltip = (clientX: number) => {
    if (!progressBarRef.current || !audioRef.current || sentences.length === 0) return

    const rect = progressBarRef.current.getBoundingClientRect()
    const offsetX = clientX - rect.left
    const percentage = Math.max(0, Math.min(1, offsetX / rect.width))
    const newTime = percentage * audioRef.current.duration

    // Find the sentence at this time
    const sentenceIndex = sentences.findIndex((sentence, i) => {
      const nextSentence = sentences[i + 1]
      return newTime >= sentence.timestamp &&
             (!nextSentence || newTime < nextSentence.timestamp)
    })

    if (sentenceIndex !== -1) {
      setTooltipVisible(true)
      setTooltipPosition(percentage * 100)
      setTooltipText(sentences[sentenceIndex].preview)
    }
  }

  // Touch start handler
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    const touch = e.touches[0]
    const newTime = calculateSeekPosition(touch.clientX)

    if (audioRef.current) {
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }

    updateTooltip(touch.clientX)
  }

  // Touch move handler (slide)
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    e.preventDefault() // Prevent default scroll behavior

    const touch = e.touches[0]
    const newTime = calculateSeekPosition(touch.clientX)

    if (audioRef.current) {
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }

    updateTooltip(touch.clientX)
  }

  // Touch end handler
  const handleTouchEnd = () => {
    setIsDragging(false)

    // Auto-hide tooltip after 3 seconds
    setTimeout(() => {
      if (!isDragging) {
        setTooltipVisible(false)
      }
    }, 3000)
  }

  const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressBarRef.current) return

    const rect = progressBarRef.current.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const percentage = clickX / rect.width
    const newTime = percentage * duration

    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)

    // On mobile: show tooltip on tap
    if (window.innerWidth <= 768 && sentences.length > 0) {
      const sentenceIndex = sentences.findIndex((sentence, i) => {
        const nextSentence = sentences[i + 1]
        return newTime >= sentence.timestamp &&
               (!nextSentence || newTime < nextSentence.timestamp)
      })

      if (sentenceIndex !== -1) {
        setTooltipVisible(true)
        setTooltipPosition(percentage * 100)
        setTooltipText(sentences[sentenceIndex].preview)

        // Auto-hide after 3 seconds
        setTimeout(() => {
          setTooltipVisible(false)
        }, 3000)
      }
    }
  }

  const handleProgressBarMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || sentences.length === 0) return

    const rect = progressBarRef.current.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const percentage = mouseX / rect.width
    const hoveredTime = percentage * duration

    // Find the sentence at this time
    const sentenceIndex = sentences.findIndex((sentence, i) => {
      const nextSentence = sentences[i + 1]
      return hoveredTime >= sentence.timestamp &&
             (!nextSentence || hoveredTime < nextSentence.timestamp)
    })

    if (sentenceIndex !== -1) {
      setTooltipVisible(true)
      setTooltipPosition(percentage * 100)
      setTooltipText(sentences[sentenceIndex].preview)
    }
  }

  const handleProgressBarMouseLeave = () => {
    setTooltipVisible(false)
  }

  const skipToSentence = (index: number) => {
    if (!audioRef.current || index < 0 || index >= sentences.length) return

    const targetTime = sentences[index].timestamp
    audioRef.current.currentTime = targetTime
    setCurrentTime(targetTime)
    setCurrentSentenceIndex(index)
  }

  const handlePreviousSentence = () => {
    // Cancel any pending auto-resume
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current)
      pauseTimeoutRef.current = null
      setIsPauseBetweenSentences(false)
    }

    const prevIndex = Math.max(0, currentSentenceIndex - 1)
    skipToSentence(prevIndex)

    // Resume playback if it was playing before
    if (!isPlaying && audioRef.current) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleNextSentence = () => {
    // Cancel any pending auto-resume
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current)
      pauseTimeoutRef.current = null
      setIsPauseBetweenSentences(false)
    }

    const nextIndex = Math.min(sentences.length - 1, currentSentenceIndex + 1)
    skipToSentence(nextIndex)

    // Resume playback if it was playing before
    if (!isPlaying && audioRef.current) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const togglePause = () => {
    setPauseConfig(prev => ({ ...prev, enabled: !prev.enabled }))
  }

  const handlePauseDurationChange = (duration: number) => {
    setPauseConfig(prev => ({ ...prev, duration }))
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  if (!audioUrl) {
    return null
  }

  return (
    <div className="audio-player">
      {showShortcuts && (
        <div className="shortcuts-overlay">
          <div className="shortcuts-content">
            <div className="shortcuts-header">
              <h3>キーボードショートカット</h3>
              <button onClick={() => setShowShortcuts(false)} className="shortcuts-close">
                ×
              </button>
            </div>
            <div className="shortcuts-list">
              <div className="shortcut-item">
                <kbd>スペース</kbd> または <kbd>K</kbd>
                <span>再生/一時停止</span>
              </div>
              <div className="shortcut-item">
                <kbd>←</kbd>
                <span>前の文</span>
              </div>
              <div className="shortcut-item">
                <kbd>→</kbd>
                <span>次の文</span>
              </div>
              <div className="shortcut-item">
                <kbd>↑</kbd>
                <span>速度を上げる</span>
              </div>
              <div className="shortcut-item">
                <kbd>↓</kbd>
                <span>速度を下げる</span>
              </div>
              <div className="shortcut-item">
                <kbd>?</kbd>
                <span>このヘルプを表示</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="player-header">
        <h3>{MESSAGES.PLAYER_TITLE}</h3>
        <div className="player-info">
          <span className="speed-indicator">{speed.toFixed(2)}x</span>
          {sentences.length > 0 && (
            <span className="sentence-counter">
              {currentSentenceIndex + 1} / {sentences.length} {MESSAGES.PLAYER_SENTENCE}
            </span>
          )}
          {isPauseBetweenSentences && (
            <span className="pause-indicator">
              ⏸ {MESSAGES.PLAYER_PAUSING} {pauseConfig.duration.toFixed(1)}s
            </span>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="player-loading">
          <div className="spinner" />
          <p>{MESSAGES.PLAYER_LOADING}</p>
        </div>
      ) : (
        <>
          <div className="player-controls">
            <button
              className="control-button"
              onClick={isPlaying ? handlePause : handlePlay}
              disabled={!audioRef.current}
              title={isPlaying ? MESSAGES.BUTTON_PAUSE : MESSAGES.BUTTON_PLAY}
            >
              {isPlaying ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button
              className="control-button"
              onClick={handleStop}
              disabled={!audioRef.current}
              title={MESSAGES.BUTTON_STOP}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" />
              </svg>
            </button>

            {sentences.length > 0 && (
              <>
                <button
                  className="control-button"
                  onClick={handlePreviousSentence}
                  disabled={!audioRef.current || currentSentenceIndex === 0}
                  title={MESSAGES.BUTTON_PREVIOUS}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                  </svg>
                </button>

                <button
                  className="control-button"
                  onClick={handleNextSentence}
                  disabled={!audioRef.current || currentSentenceIndex === sentences.length - 1}
                  title={MESSAGES.BUTTON_NEXT}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                  </svg>
                </button>
              </>
            )}

            <div className="time-display">
              <span>{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div
            className="progress-bar-container"
            ref={progressBarRef}
            onClick={handleSeek}
            onMouseMove={handleProgressBarMouseMove}
            onMouseLeave={handleProgressBarMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />

              {/* Sentence boundary markers */}
              {sentences.map((sentence, index) => {
                const position = (sentence.timestamp / duration) * 100
                return (
                  <div
                    key={index}
                    className="sentence-marker"
                    style={{ left: `${position}%` }}
                    title={sentence.preview}
                  >
                    <span className="sentence-marker-number">{index + 1}</span>
                  </div>
                )
              })}
            </div>

            {/* Tooltip */}
            {tooltipVisible && (
              <div
                className="progress-tooltip"
                style={{ left: `${tooltipPosition}%` }}
              >
                {tooltipText}
              </div>
            )}
          </div>

          <div className="speed-control">
            <label>{MESSAGES.PLAYER_SPEED}:</label>
            <input
              type="range"
              min={AUDIO_CONFIG.SPEED_MIN}
              max={AUDIO_CONFIG.SPEED_MAX}
              step={AUDIO_CONFIG.SPEED_STEP}
              value={speed}
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
            />
            <div className="speed-presets">
              {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((presetSpeed) => (
                <button
                  key={presetSpeed}
                  className={`preset-button ${speed === presetSpeed ? 'active' : ''}`}
                  onClick={() => handleSpeedChange(presetSpeed)}
                >
                  {presetSpeed}x
                </button>
              ))}
            </div>
          </div>

          {/* Pause Control */}
          <div className="pause-control">
            <div className="pause-header">
              <label>
                <input
                  type="checkbox"
                  checked={pauseConfig.enabled}
                  onChange={togglePause}
                />
                {MESSAGES.PLAYER_PAUSE_BETWEEN}
              </label>
            </div>

            {pauseConfig.enabled && (
              <div className="pause-duration">
                <label>{MESSAGES.PLAYER_PAUSE_DURATION}: {pauseConfig.duration.toFixed(1)}s</label>
                <input
                  type="range"
                  min={PAUSE_CONFIG.MIN}
                  max={PAUSE_CONFIG.MAX}
                  step={PAUSE_CONFIG.STEP}
                  value={pauseConfig.duration}
                  onChange={(e) => handlePauseDurationChange(parseFloat(e.target.value))}
                />
                <div className="pause-presets">
                  {[0.5, 1.0, 2.0, 3.0].map((preset) => (
                    <button
                      key={preset}
                      className={`preset-button ${pauseConfig.duration === preset ? 'active' : ''}`}
                      onClick={() => handlePauseDurationChange(preset)}
                    >
                      {preset}s
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Repeat Playback Control */}
          <div className="repeat-control">
            <div className="repeat-header">
              <label>🔁 リピート再生</label>
            </div>
            <div className="repeat-options">
              <div className="repeat-count">
                <label>回数:</label>
                <div className="repeat-presets">
                  {[
                    { value: 1, label: '1回' },
                    { value: 3, label: '3回' },
                    { value: 5, label: '5回' },
                    { value: -1, label: '∞' }
                  ].map((preset) => (
                    <button
                      key={preset.value}
                      className={`preset-button ${repeatCount === preset.value ? 'active' : ''}`}
                      onClick={() => setRepeatCount(preset.value)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                {currentRepeat > 0 && (
                  <span className="repeat-indicator">
                    ({currentRepeat + 1} / {repeatCount === -1 ? '∞' : repeatCount})
                  </span>
                )}
              </div>
              <div className="auto-advance">
                <label>
                  <input
                    type="checkbox"
                    checked={autoAdvance}
                    onChange={(e) => setAutoAdvance(e.target.checked)}
                  />
                  次の文へ自動移動
                </label>
              </div>
              <div className="auto-pause">
                <label>
                  <input
                    type="checkbox"
                    checked={autoPauseAfterSentence}
                    onChange={(e) => setAutoPauseAfterSentence(e.target.checked)}
                  />
                  1文ごとに一時停止（スペースキーで次へ）
                </label>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
