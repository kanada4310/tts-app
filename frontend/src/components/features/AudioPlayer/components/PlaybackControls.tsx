/**
 * PlaybackControls Component
 *
 * Renders play/pause button and speed preset buttons.
 */

import React from 'react'
import { MESSAGES } from '../../../../constants/messages'

interface PlaybackControlsProps {
  isPlaying: boolean
  speed: number
  isLoading?: boolean
  onPlay: () => void
  onPause: () => void
  onSpeedChange: (speed: number) => void
}

const SPEED_PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0]

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  speed,
  isLoading = false,
  onPlay,
  onPause,
  onSpeedChange,
}) => {
  const handleTogglePlay = () => {
    if (isPlaying) {
      onPause()
    } else {
      onPlay()
    }
  }

  return (
    <div className="playback-controls">
      {/* Play/Pause Button */}
      <div className="playback-button-container">
        <button
          className="playback-button"
          onClick={handleTogglePlay}
          disabled={isLoading}
          aria-label={isPlaying ? MESSAGES.BUTTON_PAUSE : MESSAGES.BUTTON_PLAY}
        >
          {isLoading ? (
            <span className="loading-spinner">⏳</span>
          ) : isPlaying ? (
            <span className="icon-pause">⏸</span>
          ) : (
            <span className="icon-play">▶</span>
          )}
          <span className="button-text">
            {isPlaying ? MESSAGES.BUTTON_PAUSE : MESSAGES.BUTTON_PLAY}
          </span>
        </button>
      </div>

      {/* Speed Presets */}
      <div className="speed-controls">
        <label className="speed-label">速度</label>
        <div className="speed-presets">
          {SPEED_PRESETS.map((preset) => (
            <button
              key={preset}
              className={`speed-preset-button ${speed === preset ? 'active' : ''}`}
              onClick={() => onSpeedChange(preset)}
              aria-label={`速度 ${preset}x`}
            >
              {preset}x
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
