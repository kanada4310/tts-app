/**
 * PlaybackControls Component
 *
 * Renders play/pause/stop buttons only.
 */

import React from 'react'
import { MESSAGES } from '../../../../constants/messages'

interface PlaybackControlsProps {
  isPlaying: boolean
  isLoading?: boolean
  onPlay: () => void
  onPause: () => void
  onStop: () => void
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  isLoading = false,
  onPlay,
  onPause,
  onStop,
}) => {
  return (
    <div className="playback-controls">
      {/* Main Control Buttons */}
      <div className="main-controls">
        <button
          className="control-button"
          onClick={onPlay}
          disabled={isLoading || isPlaying}
          aria-label={MESSAGES.BUTTON_PLAY}
          title={MESSAGES.BUTTON_PLAY}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>

        <button
          className="control-button"
          onClick={onPause}
          disabled={isLoading || !isPlaying}
          aria-label={MESSAGES.BUTTON_PAUSE}
          title={MESSAGES.BUTTON_PAUSE}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        </button>

        <button
          className="control-button"
          onClick={onStop}
          disabled={isLoading}
          aria-label="停止"
          title="停止"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
