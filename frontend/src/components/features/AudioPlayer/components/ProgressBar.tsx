/**
 * ProgressBar Component
 *
 * Simplified seekbar inspired by the original working implementation.
 * Unified mode: displays total duration across all segments.
 * Shows tooltip with sentence preview on hover.
 */

import React, { useState } from 'react'

interface ProgressBarProps {
  currentTime: number
  duration: number
  onSeek: (time: number) => void
  isSegmentMode?: boolean
  segmentDurations?: number[]
  currentSegmentIndex?: number
  sourceSentences?: string[]
  onSegmentSeek?: (segmentIndex: number) => void
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentTime,
  duration,
  onSeek,
  isSegmentMode = false,
  segmentDurations = [],
  currentSegmentIndex = 0,
  sourceSentences = [],
  onSegmentSeek,
}) => {
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState(0)
  const [tooltipText, setTooltipText] = useState('')
  const [tooltipAlignment, setTooltipAlignment] = useState<'left' | 'right' | 'center'>('center')
  const [lastTouchSegmentIndex, setLastTouchSegmentIndex] = useState<number | null>(null)

  // Calculate total duration and current position across all segments
  const isUnifiedMode = isSegmentMode && segmentDurations.length > 0

  const totalDuration = isUnifiedMode
    ? segmentDurations.reduce((sum, dur) => sum + dur, 0)
    : duration

  const currentTotalTime = isUnifiedMode
    ? segmentDurations.slice(0, currentSegmentIndex).reduce((sum, dur) => sum + dur, 0) + currentTime
    : currentTime

  const progressPercentage = totalDuration > 0 ? (currentTotalTime / totalDuration) * 100 : 0

  // Calculate sentence boundary positions
  const sentenceBoundaries = isUnifiedMode
    ? segmentDurations.map((_, index) => {
        const cumulativeTime = segmentDurations.slice(0, index).reduce((sum, dur) => sum + dur, 0)
        return {
          position: (cumulativeTime / totalDuration) * 100,
          index: index,
          time: cumulativeTime,
        }
      })
    : []

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickPosition = clickX / rect.width
    const seekTime = clickPosition * totalDuration

    if (isUnifiedMode && onSegmentSeek) {
      // Find which segment this time corresponds to
      let accumulatedTime = 0
      for (let i = 0; i < segmentDurations.length; i++) {
        const segmentStartTime = accumulatedTime
        accumulatedTime += segmentDurations[i]

        if (seekTime <= accumulatedTime) {
          // Found the target segment
          if (i === currentSegmentIndex) {
            // Clicking within current segment: seek within segment
            const timeWithinSegment = seekTime - segmentStartTime
            onSeek(timeWithinSegment)
          } else {
            // Clicking different segment: switch to that segment
            onSegmentSeek(i)
          }
          return
        }
      }
      // If past all segments, go to last segment
      onSegmentSeek(segmentDurations.length - 1)
    } else {
      // Regular seek within current segment
      const newTime = clickPosition * duration
      onSeek(newTime)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const hoverPosition = (mouseX / rect.width) * 100

    // Update CSS variable for hover cursor preview (Task 2.1)
    e.currentTarget.style.setProperty('--hover-position', `${hoverPosition}%`)

    if (!isUnifiedMode || sourceSentences.length === 0) {
      return
    }

    const hoverTime = (mouseX / rect.width) * totalDuration

    // Determine tooltip alignment based on position
    let alignment: 'left' | 'right' | 'center' = 'center'
    if (hoverPosition < 20) {
      alignment = 'left'
    } else if (hoverPosition > 80) {
      alignment = 'right'
    }

    // Find which sentence this corresponds to
    let accumulatedTime = 0
    for (let i = 0; i < segmentDurations.length; i++) {
      accumulatedTime += segmentDurations[i]
      if (hoverTime <= accumulatedTime) {
        const sentence = sourceSentences[i] || ''
        const preview = sentence.length > 50 ? sentence.substring(0, 50) + '...' : sentence
        setTooltipVisible(true)
        setTooltipPosition(hoverPosition)
        setTooltipText(preview)
        setTooltipAlignment(alignment)
        return
      }
    }
  }

  const handleMouseLeave = () => {
    setTooltipVisible(false)
  }

  // Touch event handlers for mobile/tablet
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isUnifiedMode || sourceSentences.length === 0) {
      return
    }

    const touch = e.touches[0]
    const rect = e.currentTarget.getBoundingClientRect()
    const touchX = touch.clientX - rect.left
    const hoverPosition = (touchX / rect.width) * 100
    const hoverTime = (touchX / rect.width) * totalDuration

    // Determine tooltip alignment based on position
    let alignment: 'left' | 'right' | 'center' = 'center'
    if (hoverPosition < 20) {
      alignment = 'left'
    } else if (hoverPosition > 80) {
      alignment = 'right'
    }

    // Find which sentence this corresponds to
    let accumulatedTime = 0
    for (let i = 0; i < segmentDurations.length; i++) {
      accumulatedTime += segmentDurations[i]
      if (hoverTime <= accumulatedTime) {
        const sentence = sourceSentences[i] || ''
        const preview = sentence.length > 50 ? sentence.substring(0, 50) + '...' : sentence
        setTooltipVisible(true)
        setTooltipPosition(hoverPosition)
        setTooltipText(preview)
        setTooltipAlignment(alignment)
        setLastTouchSegmentIndex(i) // Remember the segment
        return
      }
    }
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isUnifiedMode || sourceSentences.length === 0) {
      return
    }

    const touch = e.touches[0]
    const rect = e.currentTarget.getBoundingClientRect()
    const touchX = touch.clientX - rect.left
    const hoverPosition = (touchX / rect.width) * 100
    const hoverTime = (touchX / rect.width) * totalDuration

    // Determine tooltip alignment based on position
    let alignment: 'left' | 'right' | 'center' = 'center'
    if (hoverPosition < 20) {
      alignment = 'left'
    } else if (hoverPosition > 80) {
      alignment = 'right'
    }

    // Find which sentence this corresponds to
    let accumulatedTime = 0
    for (let i = 0; i < segmentDurations.length; i++) {
      accumulatedTime += segmentDurations[i]
      if (hoverTime <= accumulatedTime) {
        const sentence = sourceSentences[i] || ''
        const preview = sentence.length > 50 ? sentence.substring(0, 50) + '...' : sentence
        setTooltipVisible(true)
        setTooltipPosition(hoverPosition)
        setTooltipText(preview)
        setTooltipAlignment(alignment)
        setLastTouchSegmentIndex(i) // Update the segment
        return
      }
    }
  }

  const handleTouchEnd = () => {
    setTooltipVisible(false)

    // Seek to the beginning of the touched segment
    if (lastTouchSegmentIndex !== null && onSegmentSeek) {
      onSegmentSeek(lastTouchSegmentIndex)
      setLastTouchSegmentIndex(null)
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Calculate tooltip position to prevent overflow
  const getTooltipStyle = (): React.CSSProperties => {
    // If near the left edge (< 20%), align to left
    if (tooltipPosition < 20) {
      return {
        left: '0%',
        transform: 'none',
      }
    }
    // If near the right edge (> 80%), align to right
    if (tooltipPosition > 80) {
      return {
        left: 'auto',
        right: '0%',
        transform: 'none',
      }
    }
    // Otherwise, center the tooltip
    return {
      left: `${tooltipPosition}%`,
      transform: 'translateX(-50%)',
    }
  }

  return (
    <div className="progress-section">
      <div className="time-display">
        <span>{formatTime(currentTotalTime)}</span>
        <span> / </span>
        <span>{formatTime(totalDuration)}</span>
      </div>

      <div
        className="progress-bar-container"
        onClick={handleSeek}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercentage}%` }} />

          {/* Sentence boundary markers (Task 2.2: added 'active' class) */}
          {isUnifiedMode &&
            sentenceBoundaries.map((boundary) => (
              <div
                key={boundary.index}
                className={`sentence-marker ${
                  boundary.index === currentSegmentIndex ? 'active' : ''
                }`}
                style={{ left: `${boundary.position}%` }}
                title={`文 ${boundary.index + 1}`}
              />
            ))}
        </div>

        {/* Tooltip (Task 2.3: added 'show' class for animation) */}
        {tooltipVisible && (
          <div
            className={`progress-tooltip show ${tooltipAlignment === 'left' ? 'align-left' : tooltipAlignment === 'right' ? 'align-right' : ''}`}
            style={getTooltipStyle()}
          >
            {tooltipText}
          </div>
        )}
      </div>
    </div>
  )
}
