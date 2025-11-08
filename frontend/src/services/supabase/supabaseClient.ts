/**
 * Supabaseクライアント
 *
 * フロントエンドでSupabaseを使用するための基本設定
 * - 認証（ログイン、サインアップ、ログアウト）
 * - データベースアクセス
 * - ストレージアクセス
 */

import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js'

// 環境変数からSupabase設定を取得
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// 環境変数のチェック
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase環境変数が設定されていません。')
  console.warn('VITE_SUPABASE_URL:', SUPABASE_URL ? '設定済み' : '未設定')
  console.warn('VITE_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '設定済み' : '未設定')
}

// Supabaseクライアントを作成
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL || '',
  SUPABASE_ANON_KEY || ''
)

// =====================================================
// 認証関連の関数
// =====================================================

/**
 * メールアドレスとパスワードでサインアップ
 */
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    console.error('サインアップエラー:', error.message)
    throw error
  }

  return data
}

/**
 * メールアドレスとパスワードでログイン
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('ログインエラー:', error.message)
    throw error
  }

  return data
}

/**
 * Googleでログイン
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  })

  if (error) {
    console.error('Googleログインエラー:', error.message)
    throw error
  }

  return data
}

/**
 * GitHubでログイン
 */
export async function signInWithGitHub() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
  })

  if (error) {
    console.error('GitHubログインエラー:', error.message)
    throw error
  }

  return data
}

/**
 * ログアウト
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('ログアウトエラー:', error.message)
    throw error
  }
}

/**
 * 現在のユーザーを取得
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    console.error('ユーザー取得エラー:', error.message)
    return null
  }

  return user
}

/**
 * 現在のセッションを取得
 */
export async function getCurrentSession(): Promise<Session | null> {
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error) {
    console.error('セッション取得エラー:', error.message)
    return null
  }

  return session
}

/**
 * パスワードリセットメールを送信
 */
export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })

  if (error) {
    console.error('パスワードリセットエラー:', error.message)
    throw error
  }

  return data
}

/**
 * パスワードを更新
 */
export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    console.error('パスワード更新エラー:', error.message)
    throw error
  }

  return data
}

// =====================================================
// 認証状態の監視
// =====================================================

/**
 * 認証状態の変更を監視
 *
 * @example
 * onAuthStateChange((event, session) => {
 *   if (event === 'SIGNED_IN') {
 *     console.log('ログインしました', session.user)
 *   } else if (event === 'SIGNED_OUT') {
 *     console.log('ログアウトしました')
 *   }
 * })
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
}

// =====================================================
// データベースアクセス用のヘルパー関数
// =====================================================

/**
 * Supabaseのテーブル参照を取得
 *
 * @example
 * const materials = await getTable('materials').select('*')
 */
export function getTable(tableName: string) {
  return supabase.from(tableName)
}

/**
 * Supabase Storageバケットを取得
 *
 * @example
 * const { data, error } = await getStorageBucket('audio-files').upload('file.mp3', blob)
 */
export function getStorageBucket(bucketName: string) {
  return supabase.storage.from(bucketName)
}

// =====================================================
// ユーティリティ関数
// =====================================================

/**
 * Supabaseが設定されているかチェック
 */
export function isSupabaseConfigured(): boolean {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY)
}

/**
 * 認証トークンを取得（バックエンドAPIへのリクエスト用）
 */
export async function getAuthToken(): Promise<string | null> {
  const session = await getCurrentSession()
  return session?.access_token || null
}

export default supabase
