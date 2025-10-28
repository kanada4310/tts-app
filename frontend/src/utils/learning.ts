/**
 * 学習機能用のユーティリティ関数
 */

/**
 * UUIDを生成（v4形式）
 */
export function generateUUID(): string {
  // crypto.randomUUID()がサポートされている場合はそれを使用
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // フォールバック: ランダムな文字列を生成
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * 文字列のハッシュ値を生成（同期的、FNV-1a アルゴリズム）
 *
 * SHA-256の非同期処理を避けるため、同期的な簡易ハッシュを使用
 * ブックマークの一意識別子として使用
 *
 * @param text ハッシュ化する文字列
 * @returns 16進数のハッシュ文字列（8桁）
 */
export function hashString(text: string): string {
  let hash = 2166136261 // FNV offset basis (32-bit)

  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    // FNV prime: 16777619
    hash = Math.imul(hash, 16777619)
  }

  // 符号なし32ビット整数に変換して16進数文字列化
  return (hash >>> 0).toString(16).padStart(8, '0')
}

/**
 * 日付を "YYYY-MM-DD" 形式に変換（UTC基準）
 */
export function formatDateUTC(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 日付を "YYYY-MM" 形式に変換（UTC基準）
 */
export function formatMonthUTC(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * 秒を "HH:MM:SS" 形式に変換
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`
}

/**
 * 秒を "X分" または "X時間Y分" 形式に変換
 */
export function formatDurationJapanese(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return minutes > 0 ? `${hours}時間${minutes}分` : `${hours}時間`
  }
  return `${minutes}分`
}

/**
 * 2つの日付の間の日数を計算（UTC基準）
 */
export function daysBetween(date1: Date, date2: Date): number {
  const d1 = new Date(Date.UTC(date1.getUTCFullYear(), date1.getUTCMonth(), date1.getUTCDate()))
  const d2 = new Date(Date.UTC(date2.getUTCFullYear(), date2.getUTCMonth(), date2.getUTCDate()))
  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * 2つの日付が同じ日かチェック（UTC基準）
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getUTCFullYear() === date2.getUTCFullYear() &&
    date1.getUTCMonth() === date2.getUTCMonth() &&
    date1.getUTCDate() === date2.getUTCDate()
  )
}
