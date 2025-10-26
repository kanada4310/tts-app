/**
 * SpeedSettings Component
 *
 * Renders speed control with preset buttons.
 */

import React, { useState } from 'react'

interface SpeedSettingsProps {
  speed: number
  onSpeedChange: (speed: number) => void
}

const SPEED_PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0]

export const SpeedSettings: React.FC<SpeedSettingsProps> = ({ speed, onSpeedChange }) => {
  const [isSpeedExpanded, setIsSpeedExpanded] = useState(false)

  return (
    <div className="speed-settings">
      <div className="speed-settings-header">
        <h3>速度設定</h3>
        <div className="header-controls">
          <button
            className="dynamic-toggle-button"
            onClick={() => setIsSpeedExpanded(!isSpeedExpanded)}
          >
            <span className="current-value">{speed}x</span>
            <span className="toggle-icon">{isSpeedExpanded ? '▼' : '▶'}</span>
          </button>
        </div>
      </div>
      {isSpeedExpanded && (
        <div className="speed-settings-content">
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
      )}
    </div>
  )
}
