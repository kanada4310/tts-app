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
    if (!isUnifiedMode || sourceSentences.length === 0) {
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const hoverPosition = (mouseX / rect.width) * 100
    const hoverTime = (mouseX / rect.width) * totalDuration

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
        return
      }
    }
  }

  const handleMouseLeave = () => {
    setTooltipVisible(false)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
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
      >
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercentage}%` }} />

          {/* Sentence boundary markers */}
          {isUnifiedMode &&
            sentenceBoundaries.map((boundary) => (
              <div
                key={boundary.index}
                className="sentence-marker"
                style={{ left: `${boundary.position}%` }}
                title={`文 ${boundary.index + 1}`}
              />
            ))}
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
    </div>
  )
}
