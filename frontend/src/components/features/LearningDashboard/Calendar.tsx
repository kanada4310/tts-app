/**
 * Calendar
 * 学習カレンダー（月単位）
 */

import React, { useState, useMemo } from 'react'
import { formatDurationJapanese } from '@/utils/learning'

interface CalendarProps {
  dailyDuration: { [date: string]: number }
}

export const Calendar: React.FC<CalendarProps> = ({ dailyDuration }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // カレンダーのデータを生成
  const calendarData = useMemo(() => {
    const year = currentMonth.getUTCFullYear()
    const month = currentMonth.getUTCMonth()

    // 月の最初の日と最後の日
    const firstDay = new Date(Date.UTC(year, month, 1))
    const lastDay = new Date(Date.UTC(year, month + 1, 0))

    // 最初の日の曜日（0: 日曜日）
    const startDayOfWeek = firstDay.getUTCDay()

    // カレンダーのマス目を生成
    const days: Array<{ date: Date | null; duration: number }> = []

    // 空白のマス目を追加（月の最初の日まで）
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ date: null, duration: 0 })
    }

    // 月の日付を追加
    for (let day = 1; day <= lastDay.getUTCDate(); day++) {
      const date = new Date(Date.UTC(year, month, day))
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const duration = dailyDuration[dateKey] || 0

      days.push({ date, duration })
    }

    return days
  }, [currentMonth, dailyDuration])

  // 前月へ
  const goToPreviousMonth = () => {
    setCurrentMonth(
      (prev) => new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() - 1, 1))
    )
  }

  // 次月へ
  const goToNextMonth = () => {
    setCurrentMonth(
      (prev) => new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() + 1, 1))
    )
  }

  // 今日かどうか
  const isToday = (date: Date | null): boolean => {
    if (!date) return false
    const today = new Date()
    return (
      date.getUTCFullYear() === today.getUTCFullYear() &&
      date.getUTCMonth() === today.getUTCMonth() &&
      date.getUTCDate() === today.getUTCDate()
    )
  }

  return (
    <div className="calendar-container">
      {/* 月の表示とナビゲーション */}
      <div className="calendar-header">
        <button onClick={goToPreviousMonth} className="calendar-nav-button">
          ←
        </button>
        <div className="calendar-month">
          {currentMonth.getUTCFullYear()}年 {currentMonth.getUTCMonth() + 1}月
        </div>
        <button onClick={goToNextMonth} className="calendar-nav-button">
          →
        </button>
      </div>

      {/* 曜日ヘッダー */}
      <div className="calendar-weekdays">
        <div className="calendar-weekday">日</div>
        <div className="calendar-weekday">月</div>
        <div className="calendar-weekday">火</div>
        <div className="calendar-weekday">水</div>
        <div className="calendar-weekday">木</div>
        <div className="calendar-weekday">金</div>
        <div className="calendar-weekday">土</div>
      </div>

      {/* カレンダーグリッド */}
      <div className="calendar-grid">
        {calendarData.map((day, index) => (
          <div
            key={index}
            className={`calendar-day ${day.date ? 'active' : 'empty'} ${
              day.duration > 0 ? 'practiced' : ''
            } ${day.date && isToday(day.date) ? 'today' : ''}`}
            title={
              day.date && day.duration > 0
                ? `${day.date.getUTCDate()}日: ${formatDurationJapanese(day.duration)}`
                : ''
            }
          >
            {day.date && (
              <>
                <div className="calendar-day-number">{day.date.getUTCDate()}</div>
                {day.duration > 0 && <div className="calendar-day-marker">✓</div>}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
