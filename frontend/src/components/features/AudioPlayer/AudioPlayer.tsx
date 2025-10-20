/**
 * AudioPlayer Component
 *
 * Plays audio with pitch-preserving speed control using HTML5 Audio API
 */

import { useState, useEffect, useRef } from 'react'
import { AUDIO_CONFIG } from '@/constants/audio'
import './styles.css'

export interface AudioPlayerProps {
  audioUrl: string | null
  onPlaybackComplete?: () => void
}

export function AudioPlayer({ audioUrl, onPlaybackComplete }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeed] = useState<number>(AUDIO_CONFIG.SPEED_DEFAULT)
  const [isLoading, setIsLoading] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const intervalRef = useRef<number | null>(null)

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

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }

    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
  }

  const handlePlay = async () => {
    if (!audioRef.current) return

    try {
      audioRef.current.playbackRate = speed
      await audioRef.current.play()
      setIsPlaying(true)
    } catch (error) {
      console.error('Error playing audio:', error)
    }
  }

  const handlePause = () => {
    if (!audioRef.current) return
    audioRef.current.pause()
    setIsPlaying(false)
  }

  const handleStop = () => {
    if (!audioRef.current) return
    audioRef.current.pause()
    audioRef.current.currentTime = 0
    setIsPlaying(false)
    setCurrentTime(0)
  }

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed)
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
        <span className="speed-indicator">{speed.toFixed(2)}x</span>
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
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" />
              </svg>
            </button>

            <div className="time-display">
              <span>{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
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
        </>
      )}
    </div>
  )
}
