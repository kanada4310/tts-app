/**
 * useLearningSession
 * 学習セッション管理のカスタムフック
 */

import { useState, useEffect, useCallback } from 'react'
import { LearningService, BookmarkService } from '@/services/learning'
import { LEARNING_CONFIG } from '@/constants/storage'
import type { LearningSession } from '@/types/learning'

export function useLearningSession() {
  const [currentSession, setCurrentSession] = useState<LearningSession | null>(null)

  /**
   * セッションを開始
   */
  const startSession = useCallback((materialPreview: string, sentenceCount: number) => {
    const session = LearningService.startSession(materialPreview, sentenceCount)
    setCurrentSession(session)
    return session
  }, [])

  /**
   * セッションを終了
   */
  const endSession = useCallback(() => {
    if (currentSession) {
      LearningService.endSession()
      setCurrentSession(null)
    }
  }, [currentSession])

  /**
   * 再生を記録
   */
  const recordPlay = useCallback(
    (sentenceIndex: number, sentenceText: string, isRepeat: boolean) => {
      // 学習記録に記録
      LearningService.recordPlay(sentenceIndex, isRepeat)

      // ブックマークされている場合、練習回数を更新
      if (BookmarkService.isBookmarked(sentenceText)) {
        BookmarkService.recordPractice(sentenceText)
      }
    },
    []
  )

  /**
   * アプリ起動時の初期化
   * 未終了セッションのクリーンアップ
   */
  useEffect(() => {
    LearningService.cleanupUnfinishedSession()

    // 既存のセッションがあれば復元
    const existing = LearningService.getCurrentSession()
    if (existing) {
      setCurrentSession(existing)
    }
  }, [])

  /**
   * セッション終了時のクリーンアップ（アンマウント時）
   */
  useEffect(() => {
    return () => {
      if (currentSession) {
        LearningService.endSession()
      }
    }
  }, [currentSession])

  /**
   * 30分無操作で自動終了
   */
  useEffect(() => {
    if (!currentSession) return

    let timeoutId: number

    const resetTimeout = () => {
      clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => {
        console.log('[useLearningSession] Auto-ending session due to inactivity')
        endSession()
      }, LEARNING_CONFIG.AUTO_END_SESSION_AFTER_MINUTES * 60 * 1000)
    }

    // ユーザー操作で再設定
    window.addEventListener('click', resetTimeout)
    window.addEventListener('keydown', resetTimeout)
    window.addEventListener('touchstart', resetTimeout)
    resetTimeout()

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('click', resetTimeout)
      window.removeEventListener('keydown', resetTimeout)
      window.removeEventListener('touchstart', resetTimeout)
    }
  }, [currentSession, endSession])

  /**
   * ブラウザ閉じる前にセッション終了
   */
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentSession) {
        LearningService.endSession()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [currentSession])

  return {
    currentSession,
    startSession,
    endSession,
    recordPlay,
  }
}
