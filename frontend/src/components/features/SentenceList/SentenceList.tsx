/**
 * SentenceList Component
 *
 * Displays a list of sentences from the OCR result with the following features:
 * - Collapsible list
 * - Highlighting of current sentence and visible range (current +/- 3 sentences)
 * - Auto-scroll to current sentence
 * - Click to seek to sentence
 */

import { useState, useRef, useEffect } from 'react'
import type { SentenceTiming } from '@/types/api'
import './styles.css'

export interface SentenceListProps {
  sentences: string[]
  sentenceTimings: SentenceTiming[]
  currentSentenceIndex: number
  isPlaying: boolean
  onSentenceClick: (index: number) => void
}

export const SentenceList: React.FC<SentenceListProps> = ({
  sentences,
  currentSentenceIndex,
  isPlaying,
  onSentenceClick,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [autoScroll, setAutoScroll] = useState(false)
  const sentenceListRef = useRef<HTMLDivElement>(null)

  // Calculate visible range: current sentence +/- 3 sentences when playing
  const getVisibleRange = () => {
    if (!isPlaying) {
      // When not playing, all sentences are fully visible
      return { start: 0, end: sentences.length }
    }

    const start = Math.max(0, currentSentenceIndex - 3)
    const end = Math.min(sentences.length, currentSentenceIndex + 4)
    return { start, end }
  }

  const { start, end } = getVisibleRange()

  const isInVisibleRange = (index: number) => {
    return index >= start && index < end
  }

  // Auto-scroll to current sentence when playing
  useEffect(() => {
    if (isPlaying && autoScroll && sentenceListRef.current) {
      const currentElement = sentenceListRef.current.querySelector(
        `[data-sentence-index="${currentSentenceIndex}"]`
      ) as HTMLElement

      if (currentElement) {
        currentElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }
    }
  }, [currentSentenceIndex, isPlaying, autoScroll])

  return (
    <div className="sentence-list">
      {/* Header */}
      <div className="sentence-list-header">
        <h3>文リスト (全{sentences.length}文)</h3>
        <div className="header-controls">
          <label>
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            自動スクロール
          </label>
          <button onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? '展開' : '折り畳む'}
          </button>
        </div>
      </div>

      {/* List content */}
      {!isCollapsed && (
        <div className="sentence-list-content" ref={sentenceListRef}>
          {sentences.map((sentence, index) => (
            <div
              key={index}
              data-sentence-index={index}
              className={`sentence-item ${
                index === currentSentenceIndex ? 'current' : ''
              } ${
                isPlaying && !isInVisibleRange(index) ? 'out-of-range' : ''
              }`}
              onClick={() => onSentenceClick(index)}
            >
              <span className="sentence-number">{index + 1}</span>
              <span className="sentence-text">{sentence}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
