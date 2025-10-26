/**
 * RepeatSettings Component
 *
 * Renders repeat count selector, auto-advance checkbox, and auto-pause checkbox.
 */

import React, { useState } from 'react'

interface RepeatSettingsProps {
  repeatCount: number
  autoAdvance: boolean
  autoPauseAfterSentence: boolean
  onRepeatCountChange: (count: number) => void
  onAutoAdvanceChange: (value: boolean) => void
  onAutoPauseChange: (value: boolean) => void
  getRepeatDisplayText?: () => string
}

const REPEAT_OPTIONS = [
  { value: 1, label: 'なし' },
  { value: 3, label: '3回' },
  { value: 5, label: '5回' },
  { value: -1, label: '∞' },
]

export const RepeatSettings: React.FC<RepeatSettingsProps> = ({
  repeatCount,
  autoAdvance,
  autoPauseAfterSentence,
  onRepeatCountChange,
  onAutoAdvanceChange,
  onAutoPauseChange,
  getRepeatDisplayText,
}) => {
  const [isRepeatExpanded, setIsRepeatExpanded] = useState(false)

  // Get display label for current repeat count
  const getRepeatLabel = () => {
    const option = REPEAT_OPTIONS.find((opt) => opt.value === repeatCount)
    return option ? option.label : 'なし'
  }

  return (
    <div className="repeat-settings">
      <div className="repeat-settings-header">
        <h3>リピート設定</h3>
        <div className="header-controls">
          <button
            className="dynamic-toggle-button"
            onClick={() => setIsRepeatExpanded(!isRepeatExpanded)}
          >
            <span className="current-value">
              {getRepeatLabel()}
              {getRepeatDisplayText && repeatCount > 1 && (
                <span style={{ marginLeft: '6px', fontSize: '11px', opacity: 0.8 }}>
                  {getRepeatDisplayText()}
                </span>
              )}
            </span>
            <span className="toggle-icon">{isRepeatExpanded ? '▼' : '▶'}</span>
          </button>
        </div>
      </div>
      {isRepeatExpanded && (
        <div className="repeat-settings-content">
          {/* Repeat Count Selector */}
          <div className="repeat-count-selector">
            {REPEAT_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={`repeat-option ${repeatCount === option.value ? 'active' : ''}`}
                onClick={() => onRepeatCountChange(option.value)}
                aria-label={`リピート回数: ${option.label}`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Auto-advance Checkbox */}
          <div className="repeat-checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={autoAdvance}
                onChange={(e) => onAutoAdvanceChange(e.target.checked)}
                className="checkbox-input"
              />
              <span className="checkbox-text">リピート後に次の文へ自動移動</span>
            </label>
          </div>

          {/* Auto-pause after sentence Checkbox */}
          <div className="repeat-checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={autoPauseAfterSentence}
                onChange={(e) => onAutoPauseChange(e.target.checked)}
                className="checkbox-input"
              />
              <span className="checkbox-text">文ごとに一時停止（音読練習）</span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}
