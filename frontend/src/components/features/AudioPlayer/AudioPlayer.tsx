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
import { detectSentences, extractFirstWords, estimateTimestamp } from '@/utils/textAnalysis'
import type { SentenceBoundary, PauseConfig } from '@/types/audio'
import type { SentenceTiming } from '@/types/api'
import './styles.css'

export interface AudioPlayerProps {
  audioUrl: string | null
  sourceText?: string // The original OCR text for fallback
  sourceSentences?: string[] // Pre-parsed sentences from backend
  sentenceTimings?: SentenceTiming[] // Precise timings from TTS
  onPlaybackComplete?: () => void
}

export function AudioPlayer({ audioUrl, sourceText, sourceSentences, sentenceTimings, onPlaybackComplete }: AudioPlayerProps) {
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

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const intervalRef = useRef<number | null>(null)
  const pauseTimeoutRef = useRef<number | null>(null)
  const progressBarRef = useRef<HTMLDivElement | null>(null)
  const lastPausedSentenceRef = useRef<number>(-1) // Track which sentence we last paused at

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

  // Track current sentence and trigger pause on sentence change
  useEffect(() => {
    if (sentences.length === 0 || !audioRef.current) return

    // Find current sentence index based on playback time
    const index = sentences.findIndex((sentence, i) => {
      const nextSentence = sentences[i + 1]
      return currentTime >= sentence.timestamp &&
             (!nextSentence || currentTime < nextSentence.timestamp)
    })

    // Update current sentence index
    if (index !== -1 && index !== currentSentenceIndex) {
      const previousIndex = currentSentenceIndex
      setCurrentSentenceIndex(index)

      // Trigger pause when moving to a new sentence (not on initial load)
      if (pauseConfig.enabled &&
          isPlaying &&
          !isPauseBetweenSentences &&
          previousIndex !== -1 &&
          index > previousIndex &&
          index !== lastPausedSentenceRef.current) {

        // Pause the audio
        audioRef.current.pause()
        setIsPlaying(false)
        setIsPauseBetweenSentences(true)
        lastPausedSentenceRef.current = index

        // Resume after pause duration
        pauseTimeoutRef.current = window.setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play()
            setIsPlaying(true)
            setIsPauseBetweenSentences(false)
          }
        }, pauseConfig.duration * 1000)
      }
    }

    // Early pause detection: check if we're approaching the end of current sentence
    if (pauseConfig.enabled &&
        isPlaying &&
        !isPauseBetweenSentences &&
        index !== -1 &&
        index !== lastPausedSentenceRef.current &&
        !pauseTimeoutRef.current) { // Only trigger if no pause is already scheduled

      const nextSentence = sentences[index + 1]

      if (nextSentence) {
        // Calculate when current sentence ends (which is when next sentence starts)
        const currentSentenceEnd = nextSentence.timestamp
        const timeUntilEnd = currentSentenceEnd - currentTime

        // Pause 0.1 seconds before the current sentence ends
        // This prevents the next sentence from starting while we pause
        if (timeUntilEnd > 0 && timeUntilEnd <= 0.1) {
          console.log(`[AudioPlayer] Pausing before sentence ${index + 1}: currentTime=${currentTime.toFixed(3)}s, nextTimestamp=${nextSentence.timestamp.toFixed(3)}s, timeUntilEnd=${timeUntilEnd.toFixed(3)}s`)

          // Mark the pause state FIRST to prevent any other operations
          setIsPauseBetweenSentences(true)
          lastPausedSentenceRef.current = index // Mark current sentence as paused

          // Pause the audio
          audioRef.current.pause()
          setIsPlaying(false)

          // Seek to the next sentence's start position to skip any remaining audio
          // Use setTimeout to ensure pause state is set before seeking
          setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.currentTime = nextSentence.timestamp
              console.log(`[AudioPlayer] Seeked to ${nextSentence.timestamp.toFixed(3)}s (start of sentence ${index + 1})`)
            }
          }, 10)

          // Resume after pause duration
          pauseTimeoutRef.current = window.setTimeout(() => {
            if (audioRef.current) {
              console.log(`[AudioPlayer] Resuming after ${pauseConfig.duration}s pause at ${audioRef.current.currentTime.toFixed(3)}s`)
              audioRef.current.play().then(() => {
                setIsPlaying(true)
                setIsPauseBetweenSentences(false)
                pauseTimeoutRef.current = null // Clear the timeout reference
              }).catch(err => {
                console.error('[AudioPlayer] Failed to resume playback:', err)
                setIsPauseBetweenSentences(false)
                pauseTimeoutRef.current = null
              })
            }
          }, pauseConfig.duration * 1000)
        }
      }
    }
  }, [currentTime, sentences, currentSentenceIndex, pauseConfig, isPlaying, isPauseBetweenSentences])

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
        handleStop()
        onPlaybackComplete?.()
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
    lastPausedSentenceRef.current = -1
  }

  const handlePlay = async () => {
    if (!audioRef.current) return

    // Clear any pending auto-resume timeout
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current)
      pauseTimeoutRef.current = null
    }

    try {
      audioRef.current.playbackRate = speed
      await audioRef.current.play()
      setIsPlaying(true)
      setIsPauseBetweenSentences(false)
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
    setIsPauseBetweenSentences(false)
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
    setIsPauseBetweenSentences(false)
    lastPausedSentenceRef.current = -1
  }

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed)
  }

  const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressBarRef.current) return

    const rect = progressBarRef.current.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const percentage = clickX / rect.width
    const newTime = percentage * duration

    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
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
      <div className="player-header">
        <h3>Audio Player</h3>
        <div className="player-info">
          <span className="speed-indicator">{speed.toFixed(2)}x</span>
          {sentences.length > 0 && (
            <span className="sentence-counter">
              Sentence {currentSentenceIndex + 1} / {sentences.length}
            </span>
          )}
          {isPauseBetweenSentences && (
            <span className="pause-indicator">
              ⏸ Pausing {pauseConfig.duration.toFixed(1)}s
            </span>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="player-loading">
          <div className="spinner" />
          <p>Loading audio...</p>
        </div>
      ) : (
        <>
          <div className="player-controls">
            <button
              className="control-button"
              onClick={isPlaying ? handlePause : handlePlay}
              disabled={!audioRef.current}
              title={isPlaying ? 'Pause' : 'Play'}
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
              title="Stop"
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
                  title="Previous Sentence"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                  </svg>
                </button>

                <button
                  className="control-button"
                  onClick={handleNextSentence}
                  disabled={!audioRef.current || currentSentenceIndex === sentences.length - 1}
                  title="Next Sentence"
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
                  />
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
            <label>Speed:</label>
            <input
              type="range"
              min={AUDIO_CONFIG.SPEED_MIN}
              max={AUDIO_CONFIG.SPEED_MAX}
              step={AUDIO_CONFIG.SPEED_STEP}
              value={speed}
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
            />
            <div className="speed-presets">
              {[0.5, 0.75, 1.0, 1.25].map((presetSpeed) => (
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
                Pause between sentences
              </label>
            </div>

            {pauseConfig.enabled && (
              <div className="pause-duration">
                <label>Duration: {pauseConfig.duration.toFixed(1)}s</label>
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
        </>
      )}
    </div>
  )
}
