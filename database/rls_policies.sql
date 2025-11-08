-- =====================================================
-- TTS学習アプリ - Row Level Security (RLS) ポリシー
-- =====================================================
-- 作成日: 2025-11-08
-- 参照: docs/FUTURE_EXPANSION_PLAN.md
-- =====================================================
--
-- Row Level Security (RLS) により、ユーザーは自分のデータのみ
-- アクセス可能になります。これにより、マルチユーザー対応が
-- 可能になり、データの安全性が保証されます。
--
-- =====================================================

-- =====================================================
-- 1. materials テーブルのRLS
-- =====================================================

-- RLS有効化
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- SELECT: ユーザーは自分の教材のみ閲覧可能
CREATE POLICY "Users can view their own materials"
  ON materials FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: ユーザーは自分の教材のみ作成可能
CREATE POLICY "Users can insert their own materials"
  ON materials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: ユーザーは自分の教材のみ更新可能
CREATE POLICY "Users can update their own materials"
  ON materials FOR UPDATE
  USING (auth.uid() = user_id);

-- DELETE: ユーザーは自分の教材のみ削除可能
CREATE POLICY "Users can delete their own materials"
  ON materials FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 2. bookmarks テーブルのRLS
-- =====================================================

-- RLS有効化
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- SELECT: ユーザーは自分のブックマークのみ閲覧可能
CREATE POLICY "Users can view their own bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: ユーザーは自分のブックマークのみ作成可能
CREATE POLICY "Users can insert their own bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: ユーザーは自分のブックマークのみ更新可能
CREATE POLICY "Users can update their own bookmarks"
  ON bookmarks FOR UPDATE
  USING (auth.uid() = user_id);

-- DELETE: ユーザーは自分のブックマークのみ削除可能
CREATE POLICY "Users can delete their own bookmarks"
  ON bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 3. learning_sessions テーブルのRLS
-- =====================================================

-- RLS有効化
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;

-- SELECT: ユーザーは自分の学習セッションのみ閲覧可能
CREATE POLICY "Users can view their own sessions"
  ON learning_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: ユーザーは自分の学習セッションのみ作成可能
CREATE POLICY "Users can insert their own sessions"
  ON learning_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: ユーザーは自分の学習セッションのみ更新可能
CREATE POLICY "Users can update their own sessions"
  ON learning_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- DELETE: ユーザーは自分の学習セッションのみ削除可能
CREATE POLICY "Users can delete their own sessions"
  ON learning_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 4. vocabulary テーブルのRLS
-- =====================================================

-- RLS有効化
ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;

-- SELECT: ユーザーは自分の単語帳のみ閲覧可能
CREATE POLICY "Users can view their own vocabulary"
  ON vocabulary FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: ユーザーは自分の単語帳のみ作成可能
CREATE POLICY "Users can insert their own vocabulary"
  ON vocabulary FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: ユーザーは自分の単語帳のみ更新可能
CREATE POLICY "Users can update their own vocabulary"
  ON vocabulary FOR UPDATE
  USING (auth.uid() = user_id);

-- DELETE: ユーザーは自分の単語帳のみ削除可能
CREATE POLICY "Users can delete their own vocabulary"
  ON vocabulary FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 5. audio_cache テーブルのRLS（全ユーザー共有）
-- =====================================================

-- audio_cacheは全ユーザー共有のため、RLSを有効化するが
-- 全員が閲覧可能、バックエンドのみが挿入/更新可能にする

-- RLS有効化
ALTER TABLE audio_cache ENABLE ROW LEVEL SECURITY;

-- SELECT: 全認証済みユーザーが閲覧可能（音声キャッシュは共有）
CREATE POLICY "Authenticated users can view audio cache"
  ON audio_cache FOR SELECT
  USING (auth.role() = 'authenticated');

-- INSERT: サービスロール（バックエンド）のみ挿入可能
CREATE POLICY "Service role can insert audio cache"
  ON audio_cache FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- UPDATE: サービスロール（バックエンド）のみ更新可能
CREATE POLICY "Service role can update audio cache"
  ON audio_cache FOR UPDATE
  USING (auth.role() = 'service_role');

-- DELETE: サービスロール（バックエンド）のみ削除可能
CREATE POLICY "Service role can delete audio cache"
  ON audio_cache FOR DELETE
  USING (auth.role() = 'service_role');

-- =====================================================
-- 完了メッセージ
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ TTS学習アプリ - RLSポリシー設定完了';
  RAISE NOTICE '';
  RAISE NOTICE '設定されたポリシー:';
  RAISE NOTICE '  - materials: ユーザーごとに分離';
  RAISE NOTICE '  - bookmarks: ユーザーごとに分離';
  RAISE NOTICE '  - learning_sessions: ユーザーごとに分離';
  RAISE NOTICE '  - vocabulary: ユーザーごとに分離';
  RAISE NOTICE '  - audio_cache: 全ユーザー共有（バックエンドのみ書き込み）';
  RAISE NOTICE '';
  RAISE NOTICE '次のステップ: Supabase Storageバケット作成';
END $$;
