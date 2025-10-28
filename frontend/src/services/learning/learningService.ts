/**
 * Learning Service
 * 学習セッションの管理、統計計算、ストリーク計算
 */

import { LocalStorageService } from '@/services/storage/localStorageService'
import { LEARNING_STORAGE_KEYS, LEARNING_CONFIG } from '@/constants/storage'
import { generateUUID, formatDateUTC, formatMonthUTC, daysBetween } from '@/utils/learning'
import type { LearningSession, LearningStats, LearningData, SessionUpdate } from '@/types/learning'

/**
 * 学習セッション管理サービス
 */
export class LearningService {
  /**
   * 学習データを取得（初回はデフォルトデータを返す）
   */
  static getLearningData(): LearningData {
    const defaultData: LearningData = {
      sessions: [],
      stats: {
        totalSessions: 0,
        totalPlayCount: 0,
        totalDuration: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastSessionDate: null,
        monthlyDuration: {},
        dailyDuration: {},
      },
      bookmarks: [],
      lastUpdated: new Date().toISOString(),
    }

    return LocalStorageService.get<LearningData>(LEARNING_STORAGE_KEYS.LEARNING_DATA, defaultData)
  }

  /**
   * 学習データを保存
   */
  static saveLearningData(data: LearningData): boolean {
    data.lastUpdated = new Date().toISOString()

    // バックアップも作成（データ損失防止）
    const backup = LocalStorageService.get<LearningData | null>(
      LEARNING_STORAGE_KEYS.LEARNING_DATA,
      null
    )
    if (backup) {
      LocalStorageService.set(LEARNING_STORAGE_KEYS.LEARNING_DATA_BACKUP, backup)
    }

    return LocalStorageService.set(LEARNING_STORAGE_KEYS.LEARNING_DATA, data)
  }

  /**
   * セッションを開始
   */
  static startSession(materialPreview: string, sentenceCount: number): LearningSession {
    const session: LearningSession = {
      sessionId: generateUUID(),
      startTime: new Date().toISOString(),
      endTime: undefined,
      materialPreview: materialPreview.substring(0, 50), // 最初の50文字のみ
      sentenceCount,
      playCount: 0,
      repeatCount: 0,
      totalDuration: 0,
      sentencePracticeCounts: {},
      bookmarkedCount: 0,
    }

    // 現在のセッションとして保存
    LocalStorageService.set(LEARNING_STORAGE_KEYS.CURRENT_SESSION, session)

    console.log('[LearningService] Session started:', session.sessionId)
    return session
  }

  /**
   * 現在のセッションを取得
   */
  static getCurrentSession(): LearningSession | null {
    return LocalStorageService.get<LearningSession | null>(
      LEARNING_STORAGE_KEYS.CURRENT_SESSION,
      null
    )
  }

  /**
   * セッションを更新
   */
  static updateSession(updates: SessionUpdate): boolean {
    const session = this.getCurrentSession()
    if (!session) {
      console.warn('[LearningService] No active session to update')
      return false
    }

    Object.assign(session, updates)
    return LocalStorageService.set(LEARNING_STORAGE_KEYS.CURRENT_SESSION, session)
  }

  /**
   * 再生を記録
   */
  static recordPlay(sentenceIndex: number, isRepeat: boolean): void {
    const session = this.getCurrentSession()
    if (!session) return

    // 再生回数を更新
    session.playCount += 1

    // リピートの場合
    if (isRepeat) {
      session.repeatCount += 1
    }

    // 文ごとの練習回数を更新
    session.sentencePracticeCounts[sentenceIndex] =
      (session.sentencePracticeCounts[sentenceIndex] || 0) + 1

    this.updateSession(session)
  }

  /**
   * セッションを終了
   */
  static endSession(): void {
    const session = this.getCurrentSession()
    if (!session) {
      console.warn('[LearningService] No active session to end')
      return
    }

    // 終了時刻と総学習時間を計算
    const endTime = new Date()
    session.endTime = endTime.toISOString()
    session.totalDuration =
      (endTime.getTime() - new Date(session.startTime).getTime()) / 1000

    // 学習データに追加
    const data = this.getLearningData()
    data.sessions.push(session)

    // 古いセッションを削除（最大100件）
    if (data.sessions.length > LEARNING_CONFIG.MAX_SESSIONS_STORED) {
      data.sessions = data.sessions
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
        .slice(0, LEARNING_CONFIG.MAX_SESSIONS_STORED)
    }

    // 統計を更新
    this.updateStats(data)

    // 保存
    this.saveLearningData(data)

    // 現在のセッションをクリア
    LocalStorageService.remove(LEARNING_STORAGE_KEYS.CURRENT_SESSION)

    console.log('[LearningService] Session ended:', session.sessionId)
  }

  /**
   * 統計を更新
   */
  private static updateStats(data: LearningData): void {
    const stats = data.stats

    // 総セッション数
    stats.totalSessions = data.sessions.length

    // 総再生回数
    stats.totalPlayCount = data.sessions.reduce((sum, s) => sum + s.playCount, 0)

    // 総学習時間
    stats.totalDuration = data.sessions.reduce((sum, s) => sum + s.totalDuration, 0)

    // 月別・日別の学習時間
    stats.monthlyDuration = {}
    stats.dailyDuration = {}

    data.sessions.forEach((session) => {
      const startDate = new Date(session.startTime)
      const dateKey = formatDateUTC(startDate)
      const monthKey = formatMonthUTC(startDate)

      stats.dailyDuration[dateKey] = (stats.dailyDuration[dateKey] || 0) + session.totalDuration
      stats.monthlyDuration[monthKey] =
        (stats.monthlyDuration[monthKey] || 0) + session.totalDuration
    })

    // 最終学習日
    if (data.sessions.length > 0) {
      const latestSession = data.sessions.reduce((latest, s) =>
        new Date(s.startTime).getTime() > new Date(latest.startTime).getTime() ? s : latest
      )
      stats.lastSessionDate = latestSession.startTime
    }

    // ストリーク計算
    this.calculateStreak(data)
  }

  /**
   * ストリーク（連続日数）を計算
   */
  private static calculateStreak(data: LearningData): void {
    const stats = data.stats

    if (data.sessions.length === 0) {
      stats.currentStreak = 0
      stats.longestStreak = 0
      return
    }

    // セッションを日付でグループ化
    const sessionsByDate = new Map<string, LearningSession[]>()
    data.sessions.forEach((session) => {
      const dateKey = formatDateUTC(new Date(session.startTime))
      if (!sessionsByDate.has(dateKey)) {
        sessionsByDate.set(dateKey, [])
      }
      sessionsByDate.get(dateKey)!.push(session)
    })

    // 日付の配列を作成（降順）
    const dates = Array.from(sessionsByDate.keys()).sort((a, b) => b.localeCompare(a))

    // 現在のストリークを計算
    const today = new Date()
    let currentStreak = 0
    let checkDate = new Date(dates[0]) // 最新の学習日から開始

    // 最新の学習日が今日か昨日でない場合、ストリークは0
    const daysSinceLastSession = daysBetween(checkDate, today)
    if (daysSinceLastSession > 1) {
      stats.currentStreak = 0
    } else {
      // 連続している日数を数える
      for (let i = 0; i < dates.length; i++) {
        const currentDate = new Date(dates[i])

        if (i === 0) {
          // 最初の日はカウント
          currentStreak = 1
        } else {
          const prevDate = new Date(dates[i - 1])
          const daysDiff = daysBetween(currentDate, prevDate)

          if (daysDiff === 1) {
            // 連続している
            currentStreak++
          } else {
            // 連続が途切れた
            break
          }
        }
      }

      stats.currentStreak = currentStreak
    }

    // 最長ストリークを計算
    let longestStreak = 0
    let tempStreak = 1

    for (let i = 1; i < dates.length; i++) {
      const currentDate = new Date(dates[i])
      const prevDate = new Date(dates[i - 1])
      const daysDiff = daysBetween(currentDate, prevDate)

      if (daysDiff === 1) {
        tempStreak++
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 1
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak)
    stats.longestStreak = Math.max(stats.currentStreak, longestStreak)
  }

  /**
   * 統計情報を取得
   */
  static getStats(): LearningStats {
    return this.getLearningData().stats
  }

  /**
   * セッション一覧を取得（最新順）
   */
  static getSessions(limit?: number): LearningSession[] {
    const sessions = this.getLearningData().sessions
    const sorted = sessions.sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    )
    return limit ? sorted.slice(0, limit) : sorted
  }

  /**
   * 未終了セッションのクリーンアップ
   * アプリ起動時に呼び出し、未終了のセッションを処理
   */
  static cleanupUnfinishedSession(): void {
    const session = this.getCurrentSession()
    if (!session) return

    console.log('[LearningService] Found unfinished session, cleaning up...')

    // 30分以上前のセッションは終了扱い
    const startTime = new Date(session.startTime)
    const now = new Date()
    const minutesElapsed = (now.getTime() - startTime.getTime()) / (1000 * 60)

    if (minutesElapsed > LEARNING_CONFIG.AUTO_END_SESSION_AFTER_MINUTES) {
      // 終了時刻を開始時刻+30分と仮定
      const estimatedEndTime = new Date(
        startTime.getTime() + LEARNING_CONFIG.AUTO_END_SESSION_AFTER_MINUTES * 60 * 1000
      )
      session.endTime = estimatedEndTime.toISOString()
      session.totalDuration =
        (estimatedEndTime.getTime() - startTime.getTime()) / 1000

      // 学習データに追加
      const data = this.getLearningData()
      data.sessions.push(session)
      this.updateStats(data)
      this.saveLearningData(data)

      // 現在のセッションをクリア
      LocalStorageService.remove(LEARNING_STORAGE_KEYS.CURRENT_SESSION)

      console.log('[LearningService] Unfinished session cleaned up')
    }
  }
}
