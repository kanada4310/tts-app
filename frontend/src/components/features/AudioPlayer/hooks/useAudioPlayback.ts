/**
 * useAudioPlayback Hook
 *
 * Manages basic audio playback controls: play, pause, speed adjustment, and seeking.
 * Also tracks playback state (isPlaying, currentTime, duration, etc.)
 */

import { useState, useEffect, useCallback, RefObject } from 'react'
import { PlaybackState } from '../types'

interface UseAudioPlaybackOptions {
  audioRef: RefObject<HTMLAudioElement>
  onPlay?: () => void
  onPause?: () => void
  onTimeUpdate?: (currentTime: number) => void
  onEnded?: () => void
}

export function useAudioPlayback({
  audioRef,
  onPlay,
  onPause,
  onTimeUpdate,
  onEnded,
}: UseAudioPlaybackOptions) {
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    speed: 1.0,
    isLoading: false,
  })

  /**
   * Play the audio
   */
  const play = useCallback(async () => {
    if (!audioRef.current) {
      console.warn('[useAudioPlayback] Audio element not ready')
      return
    }

    try {
      setPlaybackState(prev => ({ ...prev, isLoading: true }))
      await audioRef.current.play()
      setPlaybackState(prev => ({ ...prev, isPlaying: true, isLoading: false }))
      onPlay?.()
      console.log('[useAudioPlayback] Playback started')
    } catch (error) {
      console.error('[useAudioPlayback] Failed to play audio:', error)
      setPlaybackState(prev => ({ ...prev, isPlaying: false, isLoading: false }))
    }
  }, [audioRef, onPlay])

  /**
   * Pause the audio
   */
  const pause = useCallback(() => {
    if (!audioRef.current) {
      console.warn('[useAudioPlayback] Audio element not ready')
      return
    }

    audioRef.current.pause()
    setPlaybackState(prev => ({ ...prev, isPlaying: false }))
    onPause?.()
    console.log('[useAudioPlayback] Playback paused')
  }, [audioRef, onPause])

  /**
   * Toggle play/pause
   */
  const togglePlay = useCallback(async () => {
    if (playbackState.isPlaying) {
      pause()
    } else {
      await play()
    }
  }, [playbackState.isPlaying, play, pause])

  /**
   * Set playback speed
   */
  const setSpeed = useCallback((speed: number) => {
    if (!audioRef.current) {
      console.warn('[useAudioPlayback] Audio element not ready')
      return
    }

    // Clamp speed between 0.25 and 2.0
    const clampedSpeed = Math.max(0.25, Math.min(2.0, speed))
    audioRef.current.playbackRate = clampedSpeed
    setPlaybackState(prev => ({ ...prev, speed: clampedSpeed }))
    console.log('[useAudioPlayback] Speed set to', clampedSpeed)
  }, [audioRef])

  /**
   * Seek to a specific time (in seconds)
   */
  const seek = useCallback((time: number) => {
    if (!audioRef.current) {
      console.warn('[useAudioPlayback] Audio element not ready')
      return
    }

    // Clamp time between 0 and duration
    const clampedTime = Math.max(0, Math.min(audioRef.current.duration || 0, time))
    audioRef.current.currentTime = clampedTime
    setPlaybackState(prev => ({ ...prev, currentTime: clampedTime }))
    console.log('[useAudioPlayback] Seeked to', clampedTime, 'seconds')
  }, [audioRef])

  /**
   * Update playback state when audio metadata loads
   */
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      console.log('[useAudioPlayback] Metadata loaded, duration:', audio.duration)
      setPlaybackState(prev => ({ ...prev, duration: audio.duration || 0 }))
    }

    const handleTimeUpdate = () => {
      setPlaybackState(prev => ({ ...prev, currentTime: audio.currentTime }))
      onTimeUpdate?.(audio.currentTime)
    }

    const handleEnded = () => {
      console.log('[useAudioPlayback] Playback ended')
      setPlaybackState(prev => ({ ...prev, isPlaying: false }))
      onEnded?.()
    }

    const handleWaiting = () => {
      setPlaybackState(prev => ({ ...prev, isLoading: true }))
    }

    const handleCanPlay = () => {
      setPlaybackState(prev => ({ ...prev, isLoading: false }))
    }

    const handlePlay = () => {
      console.log('[useAudioPlayback] Play event detected')
      setPlaybackState(prev => ({ ...prev, isPlaying: true, isLoading: false }))
    }

    const handlePause = () => {
      console.log('[useAudioPlayback] Pause event detected')
      setPlaybackState(prev => ({ ...prev, isPlaying: false }))
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('waiting', handleWaiting)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('waiting', handleWaiting)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
    }
  }, [audioRef, onTimeUpdate, onEnded])

  return {
    playbackState,
    play,
    pause,
    togglePlay,
    setSpeed,
    seek,
  }
}
