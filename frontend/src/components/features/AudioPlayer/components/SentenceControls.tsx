/**
 * SentenceControls Component
 *
 * Renders previous/next sentence navigation buttons and current sentence indicator.
 */

import React from 'react'
import { MESSAGES } from '../../../../constants/messages'

interface SentenceControlsProps {
  currentIndex: number
  totalSentences: number
  onPrev: () => void
  onNext: () => void
  hasPrev: boolean
  hasNext: boolean
}

export const SentenceControls: React.FC<SentenceControlsProps> = ({
  currentIndex,
  totalSentences,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}) => {
  return (
    <div className="sentence-controls">
      <button
        className="sentence-nav-button prev"
        onClick={onPrev}
        disabled={!hasPrev}
        aria-label={MESSAGES.BUTTON_PREVIOUS}
        title={MESSAGES.BUTTON_PREVIOUS}
      >
        <span className="icon">⏮</span>
        <span className="button-text">{MESSAGES.BUTTON_PREVIOUS}</span>
      </button>

      <div className="sentence-indicator">
        <span className="current-sentence">{currentIndex + 1}</span>
        <span className="separator">/</span>
        <span className="total-sentences">{totalSentences}</span>
        <span className="label">{MESSAGES.PLAYER_SENTENCE}</span>
      </div>

      <button
        className="sentence-nav-button next"
        onClick={onNext}
        disabled={!hasNext}
        aria-label={MESSAGES.BUTTON_NEXT}
        title={MESSAGES.BUTTON_NEXT}
      >
        <span className="button-text">{MESSAGES.BUTTON_NEXT}</span>
        <span className="icon">⏭</span>
      </button>
    </div>
  )
}
