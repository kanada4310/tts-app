/**
 * SessionHistory
 * セッション履歴リスト
 */

import React from 'react'
import { formatDurationJapanese } from '@/utils/learning'
import type { LearningSession } from '@/types/learning'

interface SessionHistoryProps {
  sessions: LearningSession[]
}

export const SessionHistory: React.FC<SessionHistoryProps> = ({ sessions }) => {
  if (sessions.length === 0) {
    return <div className="session-history-empty">セッション履歴がありません</div>
  }

  // 日時をフォーマット
  const formatDate = (isoString: string): string => {
    const date = new Date(isoString)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${month}/${day} ${hours}:${minutes}`
  }

  return (
    <div className="session-history-list">
      {sessions.map((session) => (
        <div key={session.sessionId} className="session-history-item">
          <div className="session-time">{formatDate(session.startTime)}</div>
          <div className="session-details">
            <div className="session-material">{session.materialPreview}...</div>
            <div className="session-stats">
              <span className="session-stat">
                ⏱️ {formatDurationJapanese(session.totalDuration)}
              </span>
              <span className="session-stat">📝 {session.sentenceCount}文</span>
              <span className="session-stat">🔊 {session.playCount}回</span>
              {session.bookmarkedCount > 0 && (
                <span className="session-stat">⭐ {session.bookmarkedCount}個</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
