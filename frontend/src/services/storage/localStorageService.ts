/**
 * localStorage Service
 * 型安全なlocalStorage操作を提供
 */

import { LEARNING_STORAGE_KEYS, LEARNING_CONFIG } from '@/constants/storage'

/**
 * localStorageの型安全なラッパー
 */
export class LocalStorageService {
  /**
   * データを取得
   * Date型のフィールドは自動的に復元される
   */
  static get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key)
      if (!item) return defaultValue

      // JSON.parseでDate型を復元
      return JSON.parse(item, (_key, value) => {
        // ISO 8601形式の文字列をDateオブジェクトに変換
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
   * Date型は自動的にISO文字列に変換される
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
   * 全データをクリア（注意: 他のアプリのデータも消える）
   */
  static clear(): void {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('[LocalStorage] Failed to clear:', error)
    }
  }

  /**
   * 学習データのみをクリア
   */
  static clearLearningData(): void {
    this.remove(LEARNING_STORAGE_KEYS.LEARNING_DATA)
    this.remove(LEARNING_STORAGE_KEYS.CURRENT_SESSION)
    this.remove(LEARNING_STORAGE_KEYS.LEARNING_DATA_BACKUP)
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

  /**
   * ストレージイベントリスナーを登録
   * 複数タブ間でのデータ同期に使用
   */
  static addStorageListener(callback: (key: string, newValue: string | null) => void): () => void {
    const handler = (e: StorageEvent) => {
      if (e.key && e.storageArea === localStorage) {
        callback(e.key, e.newValue)
      }
    }

    window.addEventListener('storage', handler)

    // リスナーを解除する関数を返す
    return () => {
      window.removeEventListener('storage', handler)
    }
  }

  /**
   * データサイズを取得（MB単位）
   */
  static getDataSize(key: string): number {
    try {
      const item = localStorage.getItem(key)
      if (!item) return 0

      const sizeInMB = new Blob([item]).size / (1024 * 1024)
      return Math.round(sizeInMB * 100) / 100 // 小数点2桁
    } catch (error) {
      console.error(`[LocalStorage] Failed to get size of ${key}:`, error)
      return 0
    }
  }
}
