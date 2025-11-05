/**
 * Bookmark Service
 * ブックマーク機能の管理
 */

import { LearningService } from './learningService'
import { generateUUID, hashString } from '@/utils/learning'
import { LEARNING_CONFIG } from '@/constants/storage'
import type { Bookmark, BookmarkFilter } from '@/types/learning'

/**
 * ブックマーク管理サービス
 */
export class BookmarkService {
  /**
   * 全ブックマークを取得
   */
  static getAllBookmarks(): Bookmark[] {
    return LearningService.getLearningData().bookmarks
  }

  /**
   * ブックマークを追加
   */
  static addBookmark(
    sentenceText: string,
    sentenceIndex: number,
    materialText: string,
    materialSentences: string[]
  ): Bookmark | null {
    const data = LearningService.getLearningData()

    // 最大数チェック
    if (data.bookmarks.length >= LEARNING_CONFIG.MAX_BOOKMARKS) {
      console.warn('[Bookmark] Maximum bookmarks reached')
      alert(`ブックマークは最大${LEARNING_CONFIG.MAX_BOOKMARKS}個までです。`)
      return null
    }

    // 文IDを生成（ハッシュ）
    const sentenceId = hashString(sentenceText)

    // 既存チェック
    const existing = data.bookmarks.find((b) => b.sentenceId === sentenceId)
    if (existing) {
      console.log('[Bookmark] Bookmark already exists')
      return existing
    }

    // 教材IDを生成（全文のハッシュ）
    const materialId = hashString(materialText)

    // 新規ブックマーク作成
    const bookmark: Bookmark = {
      bookmarkId: generateUUID(),
      sentenceId,
      sentenceText,
      sentenceIndex,
      addedAt: new Date().toISOString(),
      practiceCount: 0,
      lastPracticedAt: null,
      masteryLevel: 1, // デフォルト: 苦手
      note: '',
      // 教材データ（音声再生用）
      materialId,
      materialText,
      materialSentences,
    }

    data.bookmarks.push(bookmark)
    LearningService.saveLearningData(data)

    // 現在のセッションのブックマーク数を更新
    const currentSession = LearningService.getCurrentSession()
    if (currentSession) {
      LearningService.updateSession({
        bookmarkedCount: currentSession.bookmarkedCount + 1,
      })
    }

    console.log('[Bookmark] Bookmark added:', bookmark.bookmarkId)
    return bookmark
  }

  /**
   * ブックマークを削除
   */
  static removeBookmark(bookmarkId: string): boolean {
    const data = LearningService.getLearningData()
    const index = data.bookmarks.findIndex((b) => b.bookmarkId === bookmarkId)

    if (index === -1) {
      console.warn('[Bookmark] Bookmark not found')
      return false
    }

    data.bookmarks.splice(index, 1)
    const success = LearningService.saveLearningData(data)

    if (success) {
      console.log('[Bookmark] Bookmark removed:', bookmarkId)
    }

    return success
  }

  /**
   * ブックマークを更新
   */
  static updateBookmark(
    bookmarkId: string,
    updates: Partial<Omit<Bookmark, 'bookmarkId' | 'sentenceId'>>
  ): boolean {
    const data = LearningService.getLearningData()
    const bookmark = data.bookmarks.find((b) => b.bookmarkId === bookmarkId)

    if (!bookmark) {
      console.warn('[Bookmark] Bookmark not found')
      return false
    }

    // 更新（bookmarkId, sentenceIdは変更不可）
    Object.assign(bookmark, updates)

    const success = LearningService.saveLearningData(data)

    if (success) {
      console.log('[Bookmark] Bookmark updated:', bookmarkId)
    }

    return success
  }

  /**
   * 文がブックマーク済みかチェック
   */
  static isBookmarked(sentenceText: string): boolean {
    const sentenceId = hashString(sentenceText)
    const bookmarks = this.getAllBookmarks()
    return bookmarks.some((b) => b.sentenceId === sentenceId)
  }

  /**
   * 文のブックマークを取得
   */
  static getBookmarkBySentence(sentenceText: string): Bookmark | null {
    const sentenceId = hashString(sentenceText)
    const bookmarks = this.getAllBookmarks()
    return bookmarks.find((b) => b.sentenceId === sentenceId) || null
  }

  /**
   * ブックマークをトグル（追加/削除）
   */
  static toggleBookmark(
    sentenceText: string,
    sentenceIndex: number,
    materialText: string,
    materialSentences: string[]
  ): boolean {
    const existing = this.getBookmarkBySentence(sentenceText)

    if (existing) {
      // 削除
      return this.removeBookmark(existing.bookmarkId)
    } else {
      // 追加
      const bookmark = this.addBookmark(sentenceText, sentenceIndex, materialText, materialSentences)
      return bookmark !== null
    }
  }

  /**
   * ブックマークの練習を記録
   */
  static recordPractice(sentenceText: string): void {
    const bookmark = this.getBookmarkBySentence(sentenceText)
    if (!bookmark) return

    this.updateBookmark(bookmark.bookmarkId, {
      practiceCount: bookmark.practiceCount + 1,
      lastPracticedAt: new Date().toISOString(),
    })
  }

  /**
   * ブックマークをフィルタリング
   */
  static filterBookmarks(filter: BookmarkFilter): Bookmark[] {
    let bookmarks = this.getAllBookmarks()

    // 習得度でフィルタ
    if (filter.masteryLevel && filter.masteryLevel.length > 0) {
      bookmarks = bookmarks.filter((b) => filter.masteryLevel!.includes(b.masteryLevel))
    }

    // ソート
    bookmarks.sort((a, b) => {
      let aValue: number
      let bValue: number

      switch (filter.sortBy) {
        case 'addedAt':
          aValue = new Date(a.addedAt).getTime()
          bValue = new Date(b.addedAt).getTime()
          break
        case 'lastPracticedAt':
          aValue = a.lastPracticedAt ? new Date(a.lastPracticedAt).getTime() : 0
          bValue = b.lastPracticedAt ? new Date(b.lastPracticedAt).getTime() : 0
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

  /**
   * ブックマークした文のテキスト配列を取得
   * AudioPlayerでブックマークモード再生に使用
   */
  static getBookmarkedSentences(): string[] {
    return this.getAllBookmarks().map((b) => b.sentenceText)
  }

  /**
   * 習得度でフィルタしたブックマーク文のテキスト配列を取得
   */
  static getBookmarkedSentencesByMastery(masteryLevels: Array<1 | 2 | 3 | 4 | 5>): string[] {
    return this.filterBookmarks({
      masteryLevel: masteryLevels,
      sortBy: 'masteryLevel',
      sortOrder: 'asc',
    }).map((b) => b.sentenceText)
  }
}
