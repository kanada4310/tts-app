/**
 * ShortcutsHelp Component
 *
 * Modal that displays keyboard shortcuts list.
 */

import React, { useEffect } from 'react'

interface ShortcutsHelpProps {
  visible: boolean
  onClose: () => void
}

const SHORTCUTS = [
  { key: 'Space / K', description: '再生 / 一時停止' },
  { key: '← →', description: '前の文 / 次の文' },
  { key: '↑ ↓', description: '速度を上げる / 下げる' },
  { key: '?', description: 'このヘルプを表示' },
  { key: 'Esc', description: 'ヘルプを閉じる' },
]

export const ShortcutsHelp: React.FC<ShortcutsHelpProps> = ({ visible, onClose }) => {
  // Close on Escape key
  useEffect(() => {
    if (!visible) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [visible, onClose])

  if (!visible) return null

  return (
    <div className="shortcuts-help-overlay" onClick={onClose}>
      <div className="shortcuts-help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="shortcuts-help-header">
          <h3 className="shortcuts-help-title">⌨️ キーボードショートカット</h3>
          <button
            className="shortcuts-help-close"
            onClick={onClose}
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        <div className="shortcuts-help-content">
          <table className="shortcuts-table">
            <tbody>
              {SHORTCUTS.map((shortcut, index) => (
                <tr key={index} className="shortcut-row">
                  <td className="shortcut-key">
                    <kbd className="kbd">{shortcut.key}</kbd>
                  </td>
                  <td className="shortcut-description">{shortcut.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="shortcuts-help-footer">
          <p className="shortcuts-help-note">
            ※ テキスト入力中はショートカットは無効です
          </p>
        </div>
      </div>
    </div>
  )
}
