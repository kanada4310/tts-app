/**
 * 学習機能の型定義
 * フェーズ3B: 学習記録＆ブックマーク機能
 */

/**
 * 学習セッション
 * 1回の学習（音声生成→再生→終了）を1セッションとする
 */
export interface LearningSession {
  sessionId: string // UUID
  startTime: string // セッション開始日時（ISO 8601形式、UTC）
  endTime?: string // セッション終了日時（未終了の場合はundefined）
  materialPreview: string // 教材のプレビュー（最初の50文字）
  sentenceCount: number // 文数
  playCount: number // 再生回数（累積）
  repeatCount: number // リピート回数（累積）
  totalDuration: number // 総学習時間（秒）
  sentencePracticeCounts: { [sentenceIndex: number]: number } // 文ごとの練習回数
  bookmarkedCount: number // このセッションでブックマークした文の数
}

/**
 * 学習統計（集計データ）
 */
export interface LearningStats {
  totalSessions: number // 総セッション数
  totalPlayCount: number // 総再生回数
  totalDuration: number // 総学習時間（秒）
  currentStreak: number // 現在の連続日数
  longestStreak: number // 最長連続日数
  lastSessionDate: string | null // 最終学習日（ISO 8601形式、UTC）
  monthlyDuration: { [yearMonth: string]: number } // 月別の学習時間（秒） 例: "2025-01": 3600
  dailyDuration: { [date: string]: number } // 日別の学習時間（秒） 例: "2025-01-15": 900
}

/**
 * ブックマーク
 */
export interface Bookmark {
  bookmarkId: string // UUID
  sentenceId: string // 文のハッシュ値（同期的な簡易ハッシュ）
  sentenceText: string // 文の全文
  addedAt: string // 追加日時（ISO 8601形式、UTC）
  practiceCount: number // 練習回数（累積）
  lastPracticedAt: string | null // 最終練習日時（ISO 8601形式、UTC）
  masteryLevel: 1 | 2 | 3 | 4 | 5 // 習得度（1: 苦手、5: 習得）
  note: string // ユーザーのメモ
}

/**
 * 学習データ全体（localStorageに保存）
 */
export interface LearningData {
  sessions: LearningSession[] // 全セッション
  stats: LearningStats // 統計データ
  bookmarks: Bookmark[] // 全ブックマーク
  lastUpdated: string // 最終更新日時（ISO 8601形式、UTC）
}

/**
 * ブックマークフィルター
 */
export interface BookmarkFilter {
  masteryLevel?: Array<1 | 2 | 3 | 4 | 5> // 習得度でフィルタ
  sortBy: 'addedAt' | 'lastPracticedAt' | 'practiceCount' | 'masteryLevel' // ソート基準
  sortOrder: 'asc' | 'desc' // ソート順序
}

/**
 * セッション更新用の部分型
 */
export type SessionUpdate = Partial<Omit<LearningSession, 'sessionId' | 'startTime'>>
