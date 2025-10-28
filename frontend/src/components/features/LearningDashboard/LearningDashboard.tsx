/**
 * LearningDashboard
 * 学習記録ダッシュボード
 */

import React, { useMemo } from 'react'
import { LearningService } from '@/services/learning'
import { formatDurationJapanese } from '@/utils/learning'
import { Calendar } from './Calendar'
import { SessionHistory } from './SessionHistory'
import './styles.css'

interface LearningDashboardProps {
  onClose: () => void
}

export const LearningDashboard: React.FC<LearningDashboardProps> = ({ onClose }) => {
  const stats = useMemo(() => LearningService.getStats(), [])
  const sessions = useMemo(() => LearningService.getSessions(10), [])

  // 今月の学習時間を計算
  const thisMonthDuration = useMemo(() => {
    const now = new Date()
    const yearMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
    return stats.monthlyDuration[yearMonth] || 0
  }, [stats.monthlyDuration])

  return (
    <div className="learning-dashboard-overlay" onClick={onClose}>
      <div className="learning-dashboard-modal" onClick={(e) => e.stopPropagation()}>
        <div className="learning-dashboard-header">
          <h2>📊 学習記録</h2>
          <button className="close-button" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </div>

        <div className="learning-dashboard-content">
          {/* 統計サマリー */}
          <div className="stats-summary">
            <div className="stat-card streak">
              <div className="stat-icon">🔥</div>
              <div className="stat-content">
                <div className="stat-value">{stats.currentStreak}日</div>
                <div className="stat-label">連続記録</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⏱️</div>
              <div className="stat-content">
                <div className="stat-value">{formatDurationJapanese(thisMonthDuration)}</div>
                <div className="stat-label">今月の学習時間</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🔊</div>
              <div className="stat-content">
                <div className="stat-value">{stats.totalPlayCount}回</div>
                <div className="stat-label">総再生回数</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📚</div>
              <div className="stat-content">
                <div className="stat-value">{stats.totalSessions}回</div>
                <div className="stat-label">総セッション数</div>
              </div>
            </div>
          </div>

          {/* 最長ストリーク */}
          {stats.longestStreak > stats.currentStreak && (
            <div className="longest-streak-note">
              🏆 最長記録: {stats.longestStreak}日
            </div>
          )}

          {/* カレンダー */}
          <div className="section">
            <h3>📅 学習カレンダー</h3>
            <Calendar dailyDuration={stats.dailyDuration} />
          </div>

          {/* セッション履歴 */}
          <div className="section">
            <h3>📝 最近のセッション</h3>
            <SessionHistory sessions={sessions} />
          </div>

          {/* データ情報 */}
          {stats.totalSessions === 0 && (
            <div className="empty-state">
              <p>まだ学習記録がありません</p>
              <p>音声を生成して練習を始めましょう！</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
