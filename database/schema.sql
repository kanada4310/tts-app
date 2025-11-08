-- =====================================================
-- TTS学習アプリ - Supabaseデータベーススキーマ
-- =====================================================
-- 作成日: 2025-11-08
-- 参照: docs/FUTURE_EXPANSION_PLAN.md
-- =====================================================

-- =====================================================
-- 1. 拡張機能の有効化
-- =====================================================

-- UUID生成機能
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 2. audio_cache テーブル（全ユーザー共有）
-- =====================================================

CREATE TABLE audio_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text_hash TEXT UNIQUE NOT NULL,              -- SHA-256(text + voice + format)
  audio_url TEXT,                              -- 結合音声URL（単一文の場合、オプション）
  segment_urls JSONB NOT NULL,                 -- 文ごとの音声URL配列
  durations JSONB NOT NULL,                    -- 各文の長さ（秒）
  sentences JSONB NOT NULL,                    -- 文の配列
  format TEXT DEFAULT 'mp3' NOT NULL,
  voice TEXT DEFAULT 'alloy' NOT NULL,
  total_duration FLOAT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  access_count INT DEFAULT 1 NOT NULL,         -- 再利用回数
  created_at TIMESTAMP DEFAULT NOW(),
  last_accessed_at TIMESTAMP DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_audio_cache_text_hash ON audio_cache(text_hash);
CREATE INDEX idx_audio_cache_access_count ON audio_cache(access_count DESC);
CREATE INDEX idx_audio_cache_last_accessed ON audio_cache(last_accessed_at DESC);

COMMENT ON TABLE audio_cache IS '音声キャッシュ（全ユーザー共有、コスト削減用）';
COMMENT ON COLUMN audio_cache.text_hash IS 'テキスト+音声設定のハッシュ値（SHA-256）';
COMMENT ON COLUMN audio_cache.segment_urls IS '文ごとの音声URL配列（Supabase Storage）';
COMMENT ON COLUMN audio_cache.access_count IS '再利用回数（人気コンテンツの把握）';

-- =====================================================
-- 3. materials テーブル（ユーザーごとの教材）
-- =====================================================

CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,                                  -- ユーザーが付けたタイトル
  ocr_text TEXT NOT NULL,                      -- OCR結果の全文
  sentences JSONB NOT NULL,                    -- 文の配列
  audio_cache_id UUID REFERENCES audio_cache(id), -- 音声キャッシュへの参照
  source_type TEXT DEFAULT 'ocr',              -- 'ocr', 'manual', 'import'
  tags TEXT[],                                 -- タグ（例: ['TOEIC', '長文読解']）
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_materials_user_id ON materials(user_id);
CREATE INDEX idx_materials_created_at ON materials(created_at DESC);
CREATE INDEX idx_materials_tags ON materials USING GIN(tags);

COMMENT ON TABLE materials IS 'ユーザーごとの教材（OCR結果、手動入力等）';
COMMENT ON COLUMN materials.audio_cache_id IS '音声キャッシュへの参照（同じテキストは共有）';
COMMENT ON COLUMN materials.source_type IS '教材の取得元（ocr, manual, import）';

-- =====================================================
-- 4. bookmarks テーブル（ブックマークした文）
-- =====================================================

CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE NOT NULL,
  sentence_index INT NOT NULL,                 -- 文のインデックス（0始まり）
  sentence_text TEXT NOT NULL,                 -- 文の全文
  mastery_level INT DEFAULT 1 NOT NULL CHECK (mastery_level BETWEEN 1 AND 5),
  note TEXT,
  practice_count INT DEFAULT 0 NOT NULL,
  last_practiced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- 複合ユニーク制約（同じ教材の同じ文を複数回ブックマークしない）
  UNIQUE (user_id, material_id, sentence_index)
);

-- インデックス
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_material_id ON bookmarks(material_id);
CREATE INDEX idx_bookmarks_mastery_level ON bookmarks(mastery_level);
CREATE INDEX idx_bookmarks_created_at ON bookmarks(created_at DESC);

COMMENT ON TABLE bookmarks IS 'ブックマークした文（習得度管理、メモ機能）';
COMMENT ON COLUMN bookmarks.mastery_level IS '習得度（1-5段階の星評価）';
COMMENT ON COLUMN bookmarks.practice_count IS '練習回数';

-- =====================================================
-- 5. learning_sessions テーブル（学習セッション）
-- =====================================================

CREATE TABLE learning_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  material_id UUID REFERENCES materials(id) ON DELETE SET NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  play_count INT DEFAULT 0 NOT NULL,
  repeat_count INT DEFAULT 0 NOT NULL,
  total_duration INT DEFAULT 0 NOT NULL,       -- 秒
  sentence_practice_counts JSONB,              -- { "0": 5, "1": 3, ... }
  bookmarked_count INT DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_learning_sessions_user_id ON learning_sessions(user_id);
CREATE INDEX idx_learning_sessions_start_time ON learning_sessions(start_time DESC);
CREATE INDEX idx_learning_sessions_material_id ON learning_sessions(material_id);

COMMENT ON TABLE learning_sessions IS '学習セッション（練習履歴、統計）';
COMMENT ON COLUMN learning_sessions.sentence_practice_counts IS '文ごとの練習回数（JSON）';

-- =====================================================
-- 6. vocabulary テーブル（単語帳、将来の拡張）
-- =====================================================

CREATE TABLE vocabulary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  word TEXT NOT NULL,
  meaning TEXT,
  example_sentence TEXT,
  material_id UUID REFERENCES materials(id) ON DELETE SET NULL, -- 出典教材
  sentence_index INT,                          -- 出典文のインデックス
  cefr_level TEXT CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  frequency_rank INT,                          -- 頻度ランキング（1-10000）
  in_wordlists TEXT[],                         -- ['TOEIC', '英検準1級', ...]
  tags TEXT[],                                 -- カスタムタグ
  mastery_level INT DEFAULT 1 CHECK (mastery_level BETWEEN 1 AND 5),
  next_review_date DATE,                       -- 次回復習日（間隔反復学習）
  practice_count INT DEFAULT 0 NOT NULL,
  last_practiced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- 複合ユニーク制約（同じ単語を複数回登録しない）
  UNIQUE (user_id, word)
);

-- インデックス
CREATE INDEX idx_vocabulary_user_id ON vocabulary(user_id);
CREATE INDEX idx_vocabulary_cefr_level ON vocabulary(cefr_level);
CREATE INDEX idx_vocabulary_mastery_level ON vocabulary(mastery_level);
CREATE INDEX idx_vocabulary_next_review_date ON vocabulary(next_review_date);
CREATE INDEX idx_vocabulary_tags ON vocabulary USING GIN(tags);

COMMENT ON TABLE vocabulary IS '単語帳（CEFR判定、間隔反復学習）';
COMMENT ON COLUMN vocabulary.cefr_level IS 'CEFRレベル（A1-C2）';
COMMENT ON COLUMN vocabulary.in_wordlists IS '単語帳掲載情報（TOEIC、英検等）';
COMMENT ON COLUMN vocabulary.next_review_date IS '次回復習日（間隔反復学習用）';

-- =====================================================
-- 完了メッセージ
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ TTS学習アプリ - データベーススキーマ作成完了';
  RAISE NOTICE '次のステップ: rls_policies.sql を実行してください';
END $$;
