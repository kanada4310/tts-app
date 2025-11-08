/**
 * Supabaseサービス
 *
 * Supabase関連の機能をエクスポート
 */

export {
  supabase,
  signUp,
  signIn,
  signInWithGoogle,
  signInWithGitHub,
  signOut,
  getCurrentUser,
  getCurrentSession,
  resetPassword,
  updatePassword,
  onAuthStateChange,
  getTable,
  getStorageBucket,
  isSupabaseConfigured,
  getAuthToken,
} from './supabaseClient'
