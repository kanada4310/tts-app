# 学習機能詳細設計書

**プロジェクト**: TTS 音声学習アプリ
**対象機能**: 学習記録 & ブックマーク機能（フェーズ3B）
**作成日**: 2025-10-28（セッション#24）
**最終更新**: 2025-10-28
**作成者**: Claude Code
**ステータス**: 設計フェーズ（実装前）

---

## 📋 目次

1. [概要と目標](#概要と目標)
2. [背景と理論的根拠](#背景と理論的根拠)
3. [機能要件](#機能要件)
4. [データ構造設計](#データ構造設計)
5. [サービス層設計](#サービス層設計)
6. [UI/UXデザイン](#uiuxデザイン)
7. [既存システムとの統合](#既存システムとの統合)
8. [実装計画](#実装計画)
9. [技術的考慮事項](#技術的考慮事項)
10. [期待される効果](#期待される効果)

---

## 概要と目標

### プロジェクトの現状

**実装済み（フェーズ3A: アクティブ学習支援）**:
- ✅ リピート再生機能（1回、3回、5回、無限）
- ✅ 文ごとの一時停止機能
- ✅ テキスト表示/非表示切り替え（文リスト機能として実装）
- ✅ シャドーイング/オーバーラッピング練習の基盤完成

**未実装（フェーズ3B: 学習管理・記録）**:
- ❌ 学習記録（練習履歴）
- ❌ お気に入り・ブックマーク機能
- ❌ 速度変更の段階的練習モード（オプション）

### 本設計書の目的

このドキュメントは、**学習記録機能**と**ブックマーク機能**の詳細な設計を提供し、以下を達成します：

1. **継続性の向上**: Duolingo式の学習記録で継続日数を可視化
2. **弱点克服**: ブックマーク機能で苦手な文を重点的に練習
3. **モチベーション維持**: 学習データの可視化とゲーミフィケーション

### 目標指標

| 指標 | 現状 | 目標 | 改善率 |
|------|------|------|--------|
| 継続日数（平均） | 7日 | 15日 | **+114%** 📈 |
| 1日の学習時間 | 10分 | 20分 | **+100%** |
| 復習率 | 20% | 60% | **+200%** |
| モチベーション | 70/100 | 85/100 | **+21%** |

**実装時間**: 合計7-9時間（学習記録: 3-4h、ブックマーク: 2-3h、統合: 2h）

---

## 背景と理論的根拠

### 第二言語習得論（SLA）の観点

**音声知覚の自動化には繰り返し練習が不可欠**:
- 同じ文を複数回練習することで、音声知覚が自動化される
- ブックマーク機能により、苦手な文を効率的に復習できる
- 学習記録により、継続的な練習習慣が形成される

### 大学受験英語の観点

**継続的な音読トレーニングが合格のカギ**:
- 短期集中では効果が薄い → **継続が重要**
- 学習記録のカレンダー表示により、連続日数を可視化
- Duolingo式のストリーク（連続記録）でモチベーション維持

### 最新の学習アプリの成功要因

**Duolingo、Anki、Quizletの共通点**:
1. ✅ 学習データの可視化（連続日数、総学習時間）
2. ✅ お気に入り・ブックマーク機能
3. ✅ ゲーミフィケーション（バッジ、ストリーク）
4. ✅ 個別最適化（ユーザーの学習ペースに合わせる）

---

## 機能要件

### 機能1: 学習記録（練習履歴）

#### 概要
- 練習した日時、教材名、再生回数、総学習時間を記録
- カレンダー形式で継続日数を可視化
- localStorage使用（サーバー不要）

#### 記録対象データ

| データ項目 | 説明 | 記録タイミング |
|-----------|------|--------------|
| **セッションID** | 各学習セッションの一意識別子 | セッション開始時 |
| **開始日時** | セッション開始のタイムスタンプ | セッション開始時 |
| **終了日時** | セッション終了のタイムスタンプ | セッション終了時 |
| **教材名** | 生成した音声のテキストプレビュー（最初の50文字） | セッション開始時 |
| **文数** | 練習した文の総数 | セッション開始時 |
| **再生回数** | 音声を再生した総回数 | 再生毎に累積 |
| **リピート回数** | リピート機能で繰り返した回数 | リピート毎に累積 |
| **総学習時間** | セッションの総時間（分） | セッション終了時 |
| **文ごとの練習回数** | 各文を何回練習したか | 文の再生毎に更新 |
| **ブックマーク数** | このセッションでブックマークした文の数 | ブックマーク毎に更新 |

#### 表示データ

**学習記録ダッシュボード**:
1. **統計サマリー**:
   - 今月の総学習時間
   - 連続日数（ストリーク）🔥
   - 総再生回数
   - 総文数

2. **カレンダー表示**:
   - 月単位のカレンダー
   - 学習した日にチェックマーク✅
   - 日ごとの学習時間（ホバーで詳細表示）

3. **セッション履歴**:
   - 最近10セッションのリスト
   - 各セッションの教材名、時間、文数、再生回数

#### ユーザーストーリー

```
【学習記録 - ユースケース1】
ユーザー: 高校生Aさん
シナリオ: 英語の教科書を5ページ読み上げて練習

1. 画像アップロード → OCR → TTS生成（20文）
2. 音声再生開始（セッション自動記録開始）
3. リピート機能で各文を3回ずつ練習
4. 15分後、練習終了（セッション自動記録終了）
5. 学習記録画面を開く
6. 「今月の学習: 3時間30分、連続日数: 5日🔥」と表示
7. カレンダーで過去5日間にチェックマーク✅
8. 本日のセッション詳細: 「15分、20文、60回再生」
9. モチベーション向上！「明日も続けよう」
```

```
【学習記録 - ユースケース2】
ユーザー: 高校生Bさん
シナリオ: 連続記録が途切れてしまった

1. 前回の学習から3日経過
2. 学習記録画面を開く
3. 連続日数: 0日（リセット）😢
4. カレンダーで空白期間を確認
5. 「また今日から始めよう」とモチベーション再燃
6. 新しいセッションを開始
```

---

### 機能2: お気に入り・ブックマーク機能

#### 概要
- 特定の文をブックマーク（星マーク⭐）
- ブックマークした文のみを再生するモード
- 苦手な文を重点的に練習

#### 記録対象データ

| データ項目 | 説明 | 記録タイミング |
|-----------|------|--------------|
| **ブックマークID** | ブックマークの一意識別子 | ブックマーク追加時 |
| **文ID** | 文のハッシュ値（テキストから生成） | ブックマーク追加時 |
| **文テキスト** | ブックマークした文の全文 | ブックマーク追加時 |
| **追加日時** | ブックマークを追加したタイムスタンプ | ブックマーク追加時 |
| **練習回数** | この文を練習した累計回数 | 再生毎に更新 |
| **最終練習日** | 最後に練習した日時 | 再生毎に更新 |
| **習得度** | 1-5の5段階評価（ユーザーが設定） | ユーザーが更新 |
| **メモ** | ユーザーが追加できる自由記述 | ユーザーが追加/編集 |

#### 表示データ

**ブックマークリスト**:
1. **全ブックマーク表示**:
   - 文テキスト（先頭50文字）
   - 練習回数
   - 習得度（星1-5）
   - 最終練習日

2. **フィルタリング**:
   - 習得度でフィルタ（星1のみ表示など）
   - 日付でソート（最近追加順、最終練習順）

3. **ブックマークモード再生**:
   - ブックマークした文のみを連続再生
   - 習得度が低い順に自動並び替え（オプション）

#### ユーザーストーリー

```
【ブックマーク - ユースケース1】
ユーザー: 高校生Aさん
シナリオ: 聞き取りづらい文をブックマーク

1. 音声再生中、文リストを表示
2. 文13「The phenomenon is quite remarkable」が聞き取れない
3. 文13の右側の星マーク⭐をクリック → ブックマーク追加
4. 星が黄色に変化（ブックマーク済み）
5. 習得度を「星1（苦手）」に設定
6. メモ欄に「phenomenonの発音が難しい」と記入
7. 練習を続ける
8. 翌日、ブックマークリストを開く
9. 「ブックマークのみ再生」ボタンをクリック
10. 苦手な文だけを集中的に練習
11. 3日後、文13を再度チェック → 聞き取れるようになった！
12. 習得度を「星4（ほぼ習得）」に更新
```

```
【ブックマーク - ユースケース2】
ユーザー: 高校生Bさん
シナリオ: 試験前の復習

1. 過去2週間で50文をブックマーク
2. 試験の前日、ブックマークリストを開く
3. 習得度「星1-2」でフィルタ → 10文抽出
4. 「苦手な文のみ再生」モードで集中復習
5. 各文を5回ずつリピート練習
6. 30分で効率的に弱点克服
7. 翌日の試験で自信を持ってリスニングに臨む
```

---

## データ構造設計

### 型定義（frontend/src/types/learning.ts）

```typescript
/**
 * 学習セッション
 * 1回の学習（音声生成→再生→終了）を1セッションとする
 */
export interface LearningSession {
  sessionId: string // UUID
  startTime: Date // セッション開始日時
  endTime?: Date // セッション終了日時（未終了の場合はundefined）
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
  lastSessionDate: Date | null // 最終学習日
  monthlyDuration: { [yearMonth: string]: number } // 月別の学習時間（秒）
  dailyDuration: { [date: string]: number } // 日別の学習時間（秒）
}

/**
 * ブックマーク
 */
export interface Bookmark {
  bookmarkId: string // UUID
  sentenceId: string // 文のハッシュ値（SHA-256）
  sentenceText: string // 文の全文
  addedAt: Date // 追加日時
  practiceCount: number // 練習回数（累積）
  lastPracticedAt: Date | null // 最終練習日時
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
  lastUpdated: Date // 最終更新日時
}

/**
 * ブックマークフィルター
 */
export interface BookmarkFilter {
  masteryLevel?: Array<1 | 2 | 3 | 4 | 5> // 習得度でフィルタ
  sortBy: 'addedAt' | 'lastPracticedAt' | 'practiceCount' | 'masteryLevel' // ソート基準
  sortOrder: 'asc' | 'desc' // ソート順序
}
```

### localStorageキー定義

```typescript
// frontend/src/constants/storage.ts

export const LEARNING_STORAGE_KEYS = {
  // 学習データ全体
  LEARNING_DATA: 'tts-learning-data',

  // 現在のセッション（進行中）
  CURRENT_SESSION: 'tts-current-session',

  // バックアップ（データ損失防止）
  LEARNING_DATA_BACKUP: 'tts-learning-data-backup',
} as const

export const LEARNING_CONFIG = {
  // セッション設定
  AUTO_END_SESSION_AFTER_MINUTES: 30, // 30分無操作でセッション自動終了

  // ストリーク設定
  STREAK_GRACE_PERIOD_HOURS: 24, // 24時間以内なら連続とみなす

  // 統計設定
  MAX_SESSIONS_STORED: 100, // 保存する最大セッション数

  // ブックマーク設定
  MAX_BOOKMARKS: 500, // 最大ブックマーク数

  // localStorage容量管理
  MAX_STORAGE_SIZE_MB: 5, // 最大5MB
} as const
```

### データフローの例

```typescript
// セッション開始時
const session: LearningSession = {
  sessionId: generateUUID(),
  startTime: new Date(),
  endTime: undefined,
  materialPreview: ocrText.substring(0, 50),
  sentenceCount: ocrSentences.length,
  playCount: 0,
  repeatCount: 0,
  totalDuration: 0,
  sentencePracticeCounts: {},
  bookmarkedCount: 0,
}

// 再生時
session.playCount += 1
session.sentencePracticeCounts[currentSentenceIndex] =
  (session.sentencePracticeCounts[currentSentenceIndex] || 0) + 1

// リピート時
session.repeatCount += 1

// セッション終了時
session.endTime = new Date()
session.totalDuration = (session.endTime.getTime() - session.startTime.getTime()) / 1000
```

---

## サービス層設計

### 1. localStorage Service（基盤）

**ファイル**: `frontend/src/services/storage/localStorageService.ts`

```typescript
/**
 * localStorage Service
 * 型安全なlocalStorage操作を提供
 */

export class LocalStorageService {
  /**
   * データを取得
   */
  static get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key)
      if (!item) return defaultValue

      return JSON.parse(item, (key, value) => {
        // Date型の復元
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          return new Date(value)
        }
        return value
      }) as T
    } catch (error) {
      console.error(`[LocalStorage] Failed to get ${key}:`, error)
      return defaultValue
    }
  }

  /**
   * データを保存
   */
  static set<T>(key: string, value: T): boolean {
    try {
      // 容量チェック
      const serialized = JSON.stringify(value)
      const sizeInMB = new Blob([serialized]).size / (1024 * 1024)

      if (sizeInMB > LEARNING_CONFIG.MAX_STORAGE_SIZE_MB) {
        console.error(`[LocalStorage] Data size (${sizeInMB.toFixed(2)}MB) exceeds limit`)
        return false
      }

      localStorage.setItem(key, serialized)
      return true
    } catch (error) {
      console.error(`[LocalStorage] Failed to set ${key}:`, error)

      // Quota超過エラーの場合、古いデータを削除
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.handleQuotaExceeded(key, value)
      }

      return false
    }
  }

  /**
   * データを削除
   */
  static remove(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`[LocalStorage] Failed to remove ${key}:`, error)
    }
  }

  /**
   * 全データをクリア
   */
  static clear(): void {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('[LocalStorage] Failed to clear:', error)
    }
  }

  /**
   * Quota超過時の処理
   */
  private static handleQuotaExceeded<T>(key: string, value: T): void {
    console.warn('[LocalStorage] Quota exceeded, attempting cleanup...')

    // バックアップを削除
    this.remove(LEARNING_STORAGE_KEYS.LEARNING_DATA_BACKUP)

    // 再試行
    try {
      localStorage.setItem(key, JSON.stringify(value))
      console.log('[LocalStorage] Cleanup successful, data saved')
    } catch (retryError) {
      console.error('[LocalStorage] Cleanup failed:', retryError)
      alert('学習データの保存に失敗しました。ストレージの空き容量を確保してください。')
    }
  }
}
```

---

### 2. Learning Service（学習記録管理）

**ファイル**: `frontend/src/services/learning/learningService.ts`

```typescript
import { LocalStorageService } from '../storage/localStorageService'
import { LEARNING_STORAGE_KEYS, LEARNING_CONFIG } from '../../constants/storage'
import {
  LearningData,
  LearningSession,
  LearningStats,
} from '../../types/learning'
import { generateUUID, hashString } from '../../utils/crypto'

/**
 * Learning Service
 * 学習データの管理を担当
 */

export class LearningService {
  /**
   * 学習データ全体を取得
   */
  static getLearningData(): LearningData {
    return LocalStorageService.get<LearningData>(
      LEARNING_STORAGE_KEYS.LEARNING_DATA,
      this.createEmptyLearningData()
    )
  }

  /**
   * 学習データを保存
   */
  static saveLearningData(data: LearningData): boolean {
    // バックアップを作成
    const currentData = this.getLearningData()
    LocalStorageService.set(LEARNING_STORAGE_KEYS.LEARNING_DATA_BACKUP, currentData)

    // 新しいデータを保存
    data.lastUpdated = new Date()
    return LocalStorageService.set(LEARNING_STORAGE_KEYS.LEARNING_DATA, data)
  }

  /**
   * 新しいセッションを開始
   */
  static startSession(materialPreview: string, sentenceCount: number): LearningSession {
    const session: LearningSession = {
      sessionId: generateUUID(),
      startTime: new Date(),
      endTime: undefined,
      materialPreview,
      sentenceCount,
      playCount: 0,
      repeatCount: 0,
      totalDuration: 0,
      sentencePracticeCounts: {},
      bookmarkedCount: 0,
    }

    // 現在のセッションとして保存
    LocalStorageService.set(LEARNING_STORAGE_KEYS.CURRENT_SESSION, session)

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
   * セッションを更新（再生回数、リピート回数など）
   */
  static updateSession(updates: Partial<LearningSession>): void {
    const session = this.getCurrentSession()
    if (!session) return

    // セッションを更新
    const updatedSession = { ...session, ...updates }
    LocalStorageService.set(LEARNING_STORAGE_KEYS.CURRENT_SESSION, updatedSession)
  }

  /**
   * セッション中の再生を記録
   */
  static recordPlay(sentenceIndex: number, isRepeat: boolean = false): void {
    const session = this.getCurrentSession()
    if (!session) return

    // 再生回数を累積
    session.playCount += 1

    // リピート回数を累積
    if (isRepeat) {
      session.repeatCount += 1
    }

    // 文ごとの練習回数を累積
    session.sentencePracticeCounts[sentenceIndex] =
      (session.sentencePracticeCounts[sentenceIndex] || 0) + 1

    this.updateSession(session)
  }

  /**
   * セッションを終了
   */
  static endSession(): void {
    const session = this.getCurrentSession()
    if (!session) return

    // 終了時刻と総学習時間を計算
    const endTime = new Date()
    const totalDuration = (endTime.getTime() - session.startTime.getTime()) / 1000

    session.endTime = endTime
    session.totalDuration = totalDuration

    // 学習データに追加
    const data = this.getLearningData()
    data.sessions.push(session)

    // 古いセッションを削除（最大数を超えた場合）
    if (data.sessions.length > LEARNING_CONFIG.MAX_SESSIONS_STORED) {
      data.sessions = data.sessions.slice(-LEARNING_CONFIG.MAX_SESSIONS_STORED)
    }

    // 統計を更新
    data.stats = this.calculateStats(data.sessions)

    // 保存
    this.saveLearningData(data)

    // 現在のセッションをクリア
    LocalStorageService.remove(LEARNING_STORAGE_KEYS.CURRENT_SESSION)
  }

  /**
   * 統計を計算
   */
  private static calculateStats(sessions: LearningSession[]): LearningStats {
    const stats: LearningStats = {
      totalSessions: sessions.length,
      totalPlayCount: 0,
      totalDuration: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastSessionDate: null,
      monthlyDuration: {},
      dailyDuration: {},
    }

    // 総計を計算
    sessions.forEach(session => {
      stats.totalPlayCount += session.playCount
      stats.totalDuration += session.totalDuration

      // 月別・日別の学習時間を累積
      const dateKey = this.formatDate(session.startTime)
      const monthKey = this.formatYearMonth(session.startTime)

      stats.dailyDuration[dateKey] = (stats.dailyDuration[dateKey] || 0) + session.totalDuration
      stats.monthlyDuration[monthKey] = (stats.monthlyDuration[monthKey] || 0) + session.totalDuration
    })

    // 最終学習日
    if (sessions.length > 0) {
      stats.lastSessionDate = sessions[sessions.length - 1].startTime
    }

    // ストリーク（連続日数）を計算
    const streaks = this.calculateStreaks(sessions)
    stats.currentStreak = streaks.current
    stats.longestStreak = streaks.longest

    return stats
  }

  /**
   * ストリーク（連続日数）を計算
   */
  private static calculateStreaks(sessions: LearningSession[]): {
    current: number
    longest: number
  } {
    if (sessions.length === 0) {
      return { current: 0, longest: 0 }
    }

    // 日付ごとに整理（重複を除去）
    const uniqueDates = new Set<string>()
    sessions.forEach(session => {
      uniqueDates.add(this.formatDate(session.startTime))
    })

    const sortedDates = Array.from(uniqueDates).sort()

    // 現在のストリークを計算
    let currentStreak = 0
    const today = this.formatDate(new Date())
    const yesterday = this.formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000))

    if (sortedDates.includes(today) || sortedDates.includes(yesterday)) {
      let checkDate = today
      while (sortedDates.includes(checkDate)) {
        currentStreak++
        checkDate = this.formatDate(new Date(new Date(checkDate).getTime() - 24 * 60 * 60 * 1000))
      }
    }

    // 最長ストリークを計算
    let longestStreak = 0
    let streak = 1

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1])
      const currDate = new Date(sortedDates[i])
      const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)

      if (diffDays === 1) {
        streak++
      } else {
        longestStreak = Math.max(longestStreak, streak)
        streak = 1
      }
    }
    longestStreak = Math.max(longestStreak, streak)

    return { current: currentStreak, longest: longestStreak }
  }

  /**
   * 日付をYYYY-MM-DD形式でフォーマット
   */
  private static formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  /**
   * 日付をYYYY-MM形式でフォーマット
   */
  private static formatYearMonth(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  }

  /**
   * 空の学習データを作成
   */
  private static createEmptyLearningData(): LearningData {
    return {
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
      lastUpdated: new Date(),
    }
  }
}
```

---

### 3. Bookmark Service（ブックマーク管理）

**ファイル**: `frontend/src/services/learning/bookmarkService.ts`

```typescript
import { LearningService } from './learningService'
import { Bookmark, BookmarkFilter } from '../../types/learning'
import { generateUUID, hashString } from '../../utils/crypto'
import { LEARNING_CONFIG } from '../../constants/storage'

/**
 * Bookmark Service
 * ブックマークの管理を担当
 */

export class BookmarkService {
  /**
   * 全ブックマークを取得
   */
  static getAllBookmarks(): Bookmark[] {
    const data = LearningService.getLearningData()
    return data.bookmarks
  }

  /**
   * ブックマークを追加
   */
  static addBookmark(sentenceText: string): Bookmark | null {
    const data = LearningService.getLearningData()

    // 最大数チェック
    if (data.bookmarks.length >= LEARNING_CONFIG.MAX_BOOKMARKS) {
      console.warn('[Bookmark] Maximum bookmarks reached')
      return null
    }

    // 既存チェック（重複防止）
    const sentenceId = hashString(sentenceText)
    const existing = data.bookmarks.find(b => b.sentenceId === sentenceId)
    if (existing) {
      console.log('[Bookmark] Bookmark already exists')
      return existing
    }

    // 新規ブックマーク作成
    const bookmark: Bookmark = {
      bookmarkId: generateUUID(),
      sentenceId,
      sentenceText,
      addedAt: new Date(),
      practiceCount: 0,
      lastPracticedAt: null,
      masteryLevel: 1, // デフォルト: 苦手
      note: '',
    }

    data.bookmarks.push(bookmark)
    LearningService.saveLearningData(data)

    // 現在のセッションのブックマーク数を更新
    LearningService.updateSession({
      bookmarkedCount: (LearningService.getCurrentSession()?.bookmarkedCount || 0) + 1
    })

    return bookmark
  }

  /**
   * ブックマークを削除
   */
  static removeBookmark(bookmarkId: string): boolean {
    const data = LearningService.getLearningData()
    const index = data.bookmarks.findIndex(b => b.bookmarkId === bookmarkId)

    if (index === -1) {
      console.warn('[Bookmark] Bookmark not found')
      return false
    }

    data.bookmarks.splice(index, 1)
    return LearningService.saveLearningData(data)
  }

  /**
   * ブックマークを更新
   */
  static updateBookmark(bookmarkId: string, updates: Partial<Bookmark>): boolean {
    const data = LearningService.getLearningData()
    const bookmark = data.bookmarks.find(b => b.bookmarkId === bookmarkId)

    if (!bookmark) {
      console.warn('[Bookmark] Bookmark not found')
      return false
    }

    // 更新（sentenceId, bookmarkIdは変更不可）
    Object.assign(bookmark, {
      ...updates,
      sentenceId: bookmark.sentenceId,
      bookmarkId: bookmark.bookmarkId,
    })

    return LearningService.saveLearningData(data)
  }

  /**
   * 文がブックマーク済みかチェック
   */
  static isBookmarked(sentenceText: string): boolean {
    const sentenceId = hashString(sentenceText)
    const bookmarks = this.getAllBookmarks()
    return bookmarks.some(b => b.sentenceId === sentenceId)
  }

  /**
   * 文のブックマークを取得
   */
  static getBookmarkBySentence(sentenceText: string): Bookmark | null {
    const sentenceId = hashString(sentenceText)
    const bookmarks = this.getAllBookmarks()
    return bookmarks.find(b => b.sentenceId === sentenceId) || null
  }

  /**
   * ブックマークの練習を記録
   */
  static recordPractice(sentenceText: string): void {
    const bookmark = this.getBookmarkBySentence(sentenceText)
    if (!bookmark) return

    bookmark.practiceCount += 1
    bookmark.lastPracticedAt = new Date()

    this.updateBookmark(bookmark.bookmarkId, bookmark)
  }

  /**
   * ブックマークをフィルタリング
   */
  static filterBookmarks(filter: BookmarkFilter): Bookmark[] {
    let bookmarks = this.getAllBookmarks()

    // 習得度でフィルタ
    if (filter.masteryLevel && filter.masteryLevel.length > 0) {
      bookmarks = bookmarks.filter(b => filter.masteryLevel!.includes(b.masteryLevel))
    }

    // ソート
    bookmarks.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (filter.sortBy) {
        case 'addedAt':
          aValue = a.addedAt.getTime()
          bValue = b.addedAt.getTime()
          break
        case 'lastPracticedAt':
          aValue = a.lastPracticedAt?.getTime() || 0
          bValue = b.lastPracticedAt?.getTime() || 0
          break
        case 'practiceCount':
          aValue = a.practiceCount
          bValue = b.practiceCount
          break
        case 'masteryLevel':
          aValue = a.masteryLevel
          bValue = b.masteryLevel
          break
        default:
          return 0
      }

      return filter.sortOrder === 'asc' ? aValue - bValue : bValue - aValue
    })

    return bookmarks
  }
}
```

---

## UI/UXデザイン

### 1. 学習記録ダッシュボード

**コンポーネント**: `LearningDashboard`
**場所**: `frontend/src/components/features/LearningDashboard/`

#### ワイヤーフレーム

```
┌──────────────────────────────────────────────────────────┐
│ 📊 学習記録                                   [設定] [?] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│ │  今月の学習  │  │  連続日数    │  │  総再生回数  │      │
│ │  3時間30分   │  │  5日 🔥     │  │  320回      │      │
│ └─────────────┘  └─────────────┘  └─────────────┘      │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ 📅 10月のカレンダー                                │  │
│ ├────────────────────────────────────────────────────┤  │
│ │ 月  火  水  木  金  土  日                          │  │
│ │     1   2   3   4   5   6                          │  │
│ │ ✅  ✅  ✅  ✅  ✅  -   -   ← 連続5日！             │  │
│ │ 7   8   9   10  11  12  13                         │  │
│ │ -   ✅  -   ✅  ✅  ✅  -                           │  │
│ │ ...                                                 │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ 📝 最近のセッション                                │  │
│ ├────────────────────────────────────────────────────┤  │
│ │ 今日 15:30 - 15:45 (15分)                          │  │
│ │ "The quick brown fox..." - 20文、60回再生         │  │
│ │                                                     │  │
│ │ 昨日 18:00 - 18:25 (25分)                          │  │
│ │ "To be or not to be..." - 30文、90回再生          │  │
│ │                                                     │  │
│ │ [もっと見る]                                        │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

#### デザイン仕様

**色:**
- 背景: 白（#ffffff）
- カード背景: 淡いグレー（#f5f7fa）
- グラデーション: 紫青（#667eea → #764ba2）
- チェックマーク: 緑（#4caf50）
- ストリーク炎: オレンジ（#ff9800）

**レイアウト:**
- グリッドレイアウト（3カラム、レスポンシブ）
- カードの角丸: 12px
- 余白: 16px（PC）、12px（モバイル）

---

### 2. ブックマークリスト

**コンポーネント**: `BookmarkList`
**場所**: `frontend/src/components/features/BookmarkList/`

#### ワイヤーフレーム

```
┌──────────────────────────────────────────────────────────┐
│ ⭐ ブックマーク (15件)                        [設定] [?] │
├──────────────────────────────────────────────────────────┤
│ フィルター: [全て ▼] ソート: [追加日 ▼]              │
│                                                          │
│ [ブックマークのみ再生]  [全て削除]                      │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ ⭐⭐⭐☆☆ (習得度: 3/5)                             │  │
│ │ "The phenomenon is quite remarkable"               │  │
│ │ 練習回数: 12回 | 最終: 2日前                        │  │
│ │ メモ: phenomenonの発音が難しい                     │  │
│ │ [再生] [編集] [削除]                                │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ ⭐☆☆☆☆ (習得度: 1/5)                             │  │
│ │ "I could've done better if I had tried harder"     │  │
│ │ 練習回数: 3回 | 最終: 5日前                         │  │
│ │ メモ: could'veの聞き取りが苦手                     │  │
│ │ [再生] [編集] [削除]                                │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ [もっと読み込む]                                         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

#### デザイン仕様

**星の表示:**
- ⭐⭐⭐⭐⭐: 習得度5（完璧）- 黄色
- ⭐⭐⭐⭐☆: 習得度4（ほぼ習得）- 黄色
- ⭐⭐⭐☆☆: 習得度3（練習中）- 黄色
- ⭐⭐☆☆☆: 習得度2（やや苦手）- オレンジ
- ⭐☆☆☆☆: 習得度1（苦手）- 赤

**レイアウト:**
- リストビュー（縦並び）
- カードの角丸: 12px
- 余白: 16px（PC）、12px（モバイル）

---

### 3. SentenceList への統合

**既存コンポーネント**: `SentenceList`
**場所**: `frontend/src/components/features/SentenceList/SentenceList.tsx`

#### 追加要素

各文の右側に以下を追加:
```tsx
<div className="sentence-bookmark">
  <button
    onClick={() => handleBookmarkToggle(sentence)}
    className={isBookmarked(sentence) ? 'bookmarked' : ''}
  >
    {isBookmarked(sentence) ? '⭐' : '☆'}
  </button>
</div>
```

#### スタイル

```css
.sentence-bookmark {
  margin-left: auto;
  padding-left: 12px;
}

.sentence-bookmark button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  transition: transform 0.2s ease-out;
}

.sentence-bookmark button:hover {
  transform: scale(1.2);
}

.sentence-bookmark button.bookmarked {
  color: #ffd700; /* 黄色 */
}
```

---

## 既存システムとの統合

### App.tsx への統合

```tsx
// frontend/src/App.tsx

import React, { useState, useEffect } from 'react'
import { LearningService } from './services/learning/learningService'
import { BookmarkService } from './services/learning/bookmarkService'

function App() {
  // ... 既存のstate

  // 学習記録関連のstate
  const [currentSession, setCurrentSession] = useState<LearningSession | null>(null)
  const [showLearningDashboard, setShowLearningDashboard] = useState(false)
  const [showBookmarkList, setShowBookmarkList] = useState(false)

  // 音声生成時にセッション開始
  const handleGenerateSpeech = async () => {
    // ... 既存のコード

    // セッション開始
    const session = LearningService.startSession(
      ocrText.substring(0, 50),
      ocrSentences.length
    )
    setCurrentSession(session)
  }

  // AudioPlayer の再生イベントをフック
  const handleSentencePlay = (sentenceIndex: number, isRepeat: boolean) => {
    // 学習記録に記録
    LearningService.recordPlay(sentenceIndex, isRepeat)

    // ブックマークされている場合、練習回数を更新
    const sentence = ocrSentences[sentenceIndex]
    if (BookmarkService.isBookmarked(sentence)) {
      BookmarkService.recordPractice(sentence)
    }
  }

  // セッション終了（アンマウント時）
  useEffect(() => {
    return () => {
      if (currentSession) {
        LearningService.endSession()
      }
    }
  }, [currentSession])

  // 30分無操作で自動終了
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const resetTimeout = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        if (currentSession) {
          LearningService.endSession()
          setCurrentSession(null)
        }
      }, LEARNING_CONFIG.AUTO_END_SESSION_AFTER_MINUTES * 60 * 1000)
    }

    // ユーザー操作で再設定
    window.addEventListener('click', resetTimeout)
    window.addEventListener('keydown', resetTimeout)
    resetTimeout()

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('click', resetTimeout)
      window.removeEventListener('keydown', resetTimeout)
    }
  }, [currentSession])

  return (
    <div className="app">
      {/* ヘッダーに学習記録ボタンを追加 */}
      <header>
        <h1>音声学習アプリ</h1>
        <div className="header-buttons">
          <button onClick={() => setShowLearningDashboard(true)}>
            📊 学習記録
          </button>
          <button onClick={() => setShowBookmarkList(true)}>
            ⭐ ブックマーク
          </button>
        </div>
      </header>

      {/* ... 既存のコンポーネント */}

      {showLearningDashboard && (
        <LearningDashboard onClose={() => setShowLearningDashboard(false)} />
      )}

      {showBookmarkList && (
        <BookmarkList onClose={() => setShowBookmarkList(false)} />
      )}
    </div>
  )
}
```

---

## 実装計画

### フェーズ1: 基盤実装（2-3時間）

| タスク | 所要時間 | 担当ファイル |
|--------|---------|-------------|
| 1. 型定義作成 | 30分 | `types/learning.ts` |
| 2. localStorage Service実装 | 1時間 | `services/storage/localStorageService.ts` |
| 3. Learning Service実装 | 1.5時間 | `services/learning/learningService.ts` |

**成果物**:
- ✅ 型定義完成
- ✅ localStorage操作の基盤完成
- ✅ セッション管理機能完成

---

### フェーズ2: ブックマーク機能実装（2-3時間）

| タスク | 所要時間 | 担当ファイル |
|--------|---------|-------------|
| 1. Bookmark Service実装 | 1時間 | `services/learning/bookmarkService.ts` |
| 2. SentenceList統合 | 1時間 | `SentenceList.tsx` |
| 3. BookmarkList UI実装 | 1時間 | `BookmarkList/` |

**成果物**:
- ✅ ブックマーク追加/削除機能
- ✅ 文リストに星マーク追加
- ✅ ブックマーク一覧表示

---

### フェーズ3: 学習記録UI実装（2-3時間）

| タスク | 所要時間 | 担当ファイル |
|--------|---------|-------------|
| 1. LearningDashboard UI | 1.5時間 | `LearningDashboard/` |
| 2. カレンダーコンポーネント | 1時間 | `LearningDashboard/Calendar.tsx` |
| 3. セッション履歴リスト | 30分 | `LearningDashboard/SessionHistory.tsx` |

**成果物**:
- ✅ 学習記録ダッシュボード
- ✅ カレンダー表示
- ✅ セッション履歴表示

---

### フェーズ4: App.tsx統合とテスト（1-2時間）

| タスク | 所要時間 | 担当ファイル |
|--------|---------|-------------|
| 1. App.tsx統合 | 30分 | `App.tsx` |
| 2. セッション自動管理 | 30分 | `App.tsx` |
| 3. E2Eテスト | 1時間 | - |

**成果物**:
- ✅ 完全統合された学習機能
- ✅ E2E動作確認完了

---

### 合計実装時間

| フェーズ | 所要時間 |
|---------|---------|
| フェーズ1（基盤） | 2-3時間 |
| フェーズ2（ブックマーク） | 2-3時間 |
| フェーズ3（学習記録UI） | 2-3時間 |
| フェーズ4（統合・テスト） | 1-2時間 |
| **合計** | **7-11時間** |

**推奨スケジュール**:
- Day 1: フェーズ1（基盤実装）
- Day 2: フェーズ2（ブックマーク機能）
- Day 3: フェーズ3（学習記録UI）
- Day 4: フェーズ4（統合・テスト）

---

## 技術的考慮事項

### 1. localStorage容量管理

**問題**: localStorageの容量制限（5-10MB）

**対策**:
1. **古いセッションの削除**: 最大100セッションまで保存、それ以上は古いものから削除
2. **圧縮**: JSON.stringify時にLZ-string等で圧縮（オプション）
3. **エラーハンドリング**: QuotaExceededErrorをキャッチしてユーザーに通知

**コード例**:
```typescript
try {
  localStorage.setItem(key, value)
} catch (error) {
  if (error instanceof DOMException && error.name === 'QuotaExceededError') {
    // 古いデータを削除
    this.pruneOldSessions()
    // 再試行
    localStorage.setItem(key, value)
  }
}
```

---

### 2. Date型のシリアライズ/デシリアライズ

**問題**: JSON.stringifyでDate型が文字列になる

**対策**: JSON.parseのreviver関数でDate型を復元

```typescript
JSON.parse(item, (key, value) => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Date(value)
  }
  return value
})
```

---

### 3. セッションの自動終了

**問題**: ユーザーがブラウザを閉じた場合、セッションが終了しない

**対策**:
1. **beforeunloadイベント**: ブラウザ閉じる前にセッション終了
2. **30分無操作タイマー**: 無操作30分でセッション自動終了
3. **次回起動時チェック**: 未終了セッションがあれば、前回の終了時刻で補完

```typescript
window.addEventListener('beforeunload', () => {
  LearningService.endSession()
})
```

---

### 4. ハッシュ関数（sentenceId生成）

**問題**: 文の一意識別子が必要

**対策**: SHA-256ハッシュを使用（Web Crypto API）

```typescript
async function hashString(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
```

---

### 5. パフォーマンス最適化

**問題**: 大量のセッション/ブックマークで動作が重くなる

**対策**:
1. **仮想スクロール**: セッション履歴に仮想スクロール適用（react-window）
2. **遅延ロード**: カレンダーは表示月のみ計算
3. **メモ化**: React.memo、useMemo活用

```tsx
const Calendar = React.memo(({ sessions }) => {
  // カレンダーレンダリング
})
```

---

### 6. データのエクスポート/インポート

**将来的な拡張**:
- JSON形式でエクスポート（バックアップ用）
- インポート機能（デバイス間の移行）

```typescript
// エクスポート
function exportLearningData(): void {
  const data = LearningService.getLearningData()
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `learning-data-${Date.now()}.json`
  a.click()
}

// インポート
function importLearningData(file: File): void {
  const reader = new FileReader()
  reader.onload = (e) => {
    const json = e.target?.result as string
    const data = JSON.parse(json) as LearningData
    LearningService.saveLearningData(data)
  }
  reader.readAsText(file)
}
```

---

## 期待される効果

### ユーザー指標の改善

| 指標 | 現状 | 目標（実装後） | 改善率 |
|------|------|--------------|--------|
| 継続日数（平均） | 7日 | 15日 | **+114%** 📈 |
| 1日の学習時間 | 10分 | 20分 | **+100%** |
| 復習率 | 20% | 60% | **+200%** |
| モチベーション | 70/100 | 85/100 | **+21%** |
| 苦手文の特定率 | 0%（不可） | 80% | **新規** 🎉 |

### 学習効果の向上

**SLA（第二言語習得論）の観点**:
- ✅ **音声知覚の自動化**: 繰り返し練習により自動化が促進
- ✅ **弱点克服**: ブックマーク機能で苦手な文を集中的に練習
- ✅ **継続的な練習**: 学習記録により習慣形成

**大学受験英語の観点**:
- ✅ **継続的な音読トレーニング**: 連続日数の可視化で習慣化
- ✅ **弱点の明確化**: ブックマークで復習対象を明確に
- ✅ **学習量の可視化**: 総学習時間でモチベーション維持

### ROI（投資対効果）

**実装時間**: 7-11時間
**期待効果**:
- 継続日数: +114%
- モチベーション: +21%
- 復習効率: +200%

**ROI**: ⭐⭐⭐⭐⭐（非常に高い）

---

## 次のステップ

### 実装前の確認事項

1. ✅ 設計書のレビュー完了
2. ✅ ユーザーの承認取得
3. ⏳ 実装計画の最終確認

### 実装開始

**推奨**: フェーズ1（基盤実装）から開始

**初回タスク**:
1. `types/learning.ts` を作成
2. `services/storage/localStorageService.ts` を実装
3. 簡単なテストで動作確認

---

## 参考資料

- [LEARNING_ENHANCEMENT.md](./LEARNING_ENHANCEMENT.md) - 学習効果向上のための機能拡張提案
- [USABILITY_REPORT.md](./USABILITY_REPORT.md) - ユーザビリティ評価レポート
- [TODO.md](./sessions/TODO.md) - 現在の実装状況
- [既存コードベース調査レポート] - セッション#24で作成

---

**作成者**: Claude Code
**作成日**: 2025-10-28（セッション#24）
**ステータス**: 設計完了、実装待ち
**次回更新**: 実装開始後
