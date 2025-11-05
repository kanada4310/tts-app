# 今後の拡張設計書（Future Expansion Plan）

**作成日**: 2025-11-05
**対象**: TTS学習アプリの長期拡張計画
**目的**: 英語学習の総合的なアプリへの進化

---

## 📖 目次

1. [プロジェクトビジョン](#プロジェクトビジョン)
2. [現在のアーキテクチャ](#現在のアーキテクチャ)
3. [Supabase移行計画](#supabase移行計画)
4. [データベーススキーマ設計](#データベーススキーマ設計)
5. [音声キャッシュ機構](#音声キャッシュ機構)
6. [認証システム](#認証システム)
7. [将来の機能拡張](#将来の機能拡張)
8. [実装ロードマップ](#実装ロードマップ)
9. [コスト見積もり](#コスト見積もり)
10. [技術的な注意事項](#技術的な注意事項)

---

## プロジェクトビジョン

### 最終目標

**英語学習を効率化するための総合的なアプリ**

- 長文OCR → 音読練習（現在実装済み）
- 単語のCEFR判定・頻度分析・単語帳掲載情報
- 単語・表現・構文のストック管理
- ストックした内容をスムーズに音読練習につなげる

### ターゲットユーザー

- 高校生（大学受験）
- 大学生（TOEIC、英検）
- 社会人（ビジネス英語）

---

## 現在のアーキテクチャ

### システム構成（2025-11-05時点）

```
┌─────────────────────────────────────────────────────────────┐
│ フロントエンド (Vercel)                                      │
│ - React + TypeScript + Vite                                 │
│ - データ保存: localStorage (ブラウザローカル)                │
│   - 学習記録（sessions, stats）                              │
│   - ブックマーク（bookmarks）                                │
│   - 教材データ（materialText, materialSentences）            │
│ - 制限: 5-10MB、単一ブラウザのみ                             │
└─────────────────────────────────────────────────────────────┘
                              ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│ バックエンド (Railway)                                       │
│ - FastAPI + Python 3.11                                     │
│ - サービス:                                                  │
│   - Gemini OCR (複数画像、文分割)                            │
│   - OpenAI TTS (音声生成、文ごとのセグメント)                │
│ - データベース: なし（ステートレス）                          │
│ - 音声保存: なし（毎回再生成）                               │
└─────────────────────────────────────────────────────────────┘
```

### 現在の制限事項

1. **データ永続化**
   - ブラウザのlocalStorageのみ（5-10MB制限）
   - デバイス間で同期不可
   - ブラウザキャッシュクリアでデータ消失

2. **音声管理**
   - 毎回TTS APIを呼び出し（コスト増）
   - オフライン再生不可

3. **ユーザー管理**
   - 認証機能なし
   - マルチデバイス対応不可

4. **機能制限**
   - 単語分析機能なし
   - 単語帳管理なし

---

## Supabase移行計画

### なぜSupabase？

**Supabaseの利点:**
- ✅ PostgreSQL（高機能DB）
- ✅ 認証システム（メール、Google、GitHub等）
- ✅ リアルタイム同期
- ✅ ファイルストレージ（音声キャッシュ）
- ✅ TypeScript SDK完備
- ✅ FastAPIと簡単に統合
- ✅ 無料枠: 500MB DB、50,000 月間アクティブユーザー

**代替案との比較:**

| サービス | DB | 認証 | ストレージ | 無料枠 | FastAPI統合 |
|---------|-----|-----|-----------|-------|-------------|
| Supabase | PostgreSQL | ✅ | ✅ | 500MB | 簡単 |
| Firebase | Firestore | ✅ | ✅ | 1GB | 複雑 |
| MongoDB Atlas | MongoDB | ❌ | ❌ | 512MB | 普通 |

**結論: Supabaseを推奨**

---

## データベーススキーマ設計

### テーブル構造

#### 1. `users` テーブル（Supabase Authが自動管理）

```sql
-- Supabase Authが自動生成
-- auth.users テーブル
id UUID PRIMARY KEY
email TEXT UNIQUE
created_at TIMESTAMP
```

#### 2. `audio_cache` テーブル（全ユーザー共有）

```sql
CREATE TABLE audio_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text_hash TEXT UNIQUE NOT NULL,              -- SHA-256(text + voice + format)
  audio_url TEXT,                              -- 結合音声URL（単一文の場合）
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
```

**設計思想:**
- テキスト+音声設定のハッシュ値で重複検出
- 複数ユーザーが同じ教材を使う場合、音声を共有（コスト削減）
- `access_count`で人気教材を把握
- `last_accessed_at`で古いキャッシュを自動削除

#### 3. `materials` テーブル（ユーザーごと）

```sql
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- RLS (Row Level Security)
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own materials"
  ON materials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own materials"
  ON materials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own materials"
  ON materials FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own materials"
  ON materials FOR DELETE
  USING (auth.uid() = user_id);
```

#### 4. `bookmarks` テーブル

```sql
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
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

-- RLS
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookmarks"
  ON bookmarks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON bookmarks FOR DELETE
  USING (auth.uid() = user_id);
```

#### 5. `learning_sessions` テーブル

```sql
CREATE TABLE learning_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- RLS
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
  ON learning_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON learning_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON learning_sessions FOR UPDATE
  USING (auth.uid() = user_id);
```

#### 6. `vocabulary` テーブル（単語帳、将来の拡張）

```sql
CREATE TABLE vocabulary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- RLS
ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vocabulary"
  ON vocabulary FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vocabulary"
  ON vocabulary FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vocabulary"
  ON vocabulary FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vocabulary"
  ON vocabulary FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 音声キャッシュ機構

### アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│ フロントエンド                                               │
│  1. 音声生成リクエスト（text, sentences, voice, format）     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ バックエンド (FastAPI)                                       │
│  2. テキストハッシュ計算 (SHA-256)                           │
│  3. audio_cache テーブルを検索                               │
└─────────────────────────────────────────────────────────────┘
          ↓ キャッシュヒット？
        Yes ↓                                    No ↓
┌────────────────────────┐            ┌────────────────────────┐
│ キャッシュから音声取得  │            │ OpenAI TTS API呼び出し  │
│  - segment_urls返却     │            │  - 音声生成（新規）      │
│  - access_count++      │            │  - Supabase Storageに   │
│  - last_accessed更新    │            │    アップロード          │
└────────────────────────┘            │  - audio_cacheに保存    │
                                      └────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Supabase Storage                                            │
│  - ファイルパス: audio/{text_hash}/segment_{index}.mp3       │
│  - 公開URL生成                                                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ フロントエンド                                               │
│  - 音声URL配列を受け取り                                      │
│  - AudioPlayerで再生                                         │
└─────────────────────────────────────────────────────────────┘
```

### 実装コード例

```python
# backend/app/services/audio_cache_service.py
import hashlib
from supabase import create_client

async def get_or_create_audio(
    text: str,
    sentences: list,
    voice: str,
    format: str
):
    # 1. ハッシュ値を計算
    hash_input = f"{text}:{voice}:{format}"
    text_hash = hashlib.sha256(hash_input.encode()).hexdigest()

    # 2. キャッシュを検索
    cached = await supabase.from_('audio_cache') \
        .select('*') \
        .eq('text_hash', text_hash) \
        .single() \
        .execute()

    if cached.data:
        # キャッシュヒット
        await supabase.from_('audio_cache') \
            .update({
                'access_count': cached.data['access_count'] + 1,
                'last_accessed_at': 'NOW()'
            }) \
            .eq('id', cached.data['id']) \
            .execute()

        return {
            'segment_urls': cached.data['segment_urls'],
            'durations': cached.data['durations'],
            'cached': True
        }

    # キャッシュミス: 新規生成
    audio_blobs, durations = await generate_speech_separated(
        text, sentences, voice, format
    )

    # 3. Supabase Storageにアップロード
    segment_urls = []
    total_size = 0

    for i, blob in enumerate(audio_blobs):
        file_path = f"audio/{text_hash}/segment_{i}.{format}"

        # アップロード
        await supabase.storage \
            .from_('audio-files') \
            .upload(file_path, blob)

        # 公開URL取得
        url = supabase.storage \
            .from_('audio-files') \
            .get_public_url(file_path)

        segment_urls.append(url)
        total_size += len(blob)

    # 4. キャッシュに保存
    cache_entry = {
        'text_hash': text_hash,
        'segment_urls': segment_urls,
        'durations': durations,
        'sentences': sentences,
        'format': format,
        'voice': voice,
        'total_duration': sum(durations),
        'file_size_bytes': total_size
    }

    await supabase.from_('audio_cache') \
        .insert(cache_entry) \
        .execute()

    return {
        'segment_urls': segment_urls,
        'durations': durations,
        'cached': False
    }
```

### キャッシュ削除ポリシー

```sql
-- 90日間アクセスされていないキャッシュを削除（週次バッチ）
DELETE FROM audio_cache
WHERE last_accessed_at < NOW() - INTERVAL '90 days';

-- または、access_count=1（一度しか使われていない）を削除
DELETE FROM audio_cache
WHERE access_count = 1
  AND last_accessed_at < NOW() - INTERVAL '30 days';
```

---

## 認証システム

### Supabase Auth統合

#### フロントエンド（React）

```typescript
// frontend/src/services/auth/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ログイン
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

// サインアップ
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) throw error
  return data
}

// ログアウト
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// 現在のユーザー取得
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
```

#### Protected Routes

```typescript
// frontend/src/components/ProtectedRoute.tsx
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { getCurrentUser } from '@/services/auth/supabaseClient'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser().then((user) => {
      setUser(user)
      setLoading(false)
    })
  }, [])

  if (loading) return <div>Loading...</div>
  if (!user) return <Navigate to="/login" />

  return <>{children}</>
}
```

#### バックエンド（FastAPI）

```python
# backend/app/core/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    JWTトークンを検証して現在のユーザーを取得
    """
    token = credentials.credentials

    try:
        # Supabaseでトークン検証
        user = supabase.auth.get_user(token)
        return user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# 使用例
@router.post("/api/materials")
async def create_material(
    data: MaterialCreate,
    current_user = Depends(get_current_user)
):
    # current_user.id でユーザーIDを取得
    material = await create_material_in_db(data, current_user.id)
    return material
```

---

## 将来の機能拡張

### フェーズ3: 単語分析機能

#### 機能概要

- 長文中の単語をCEFRレベル（A1-C2）で判定
- 頻度ランキング表示（BNC/COCAコーパス）
- 単語帳掲載情報（TOEIC、英検、大学受験単語帳）

#### 実装方法

**外部API統合:**

1. **Oxford Dictionary API** (有料)
   - CEFR判定
   - 定義、例文
   - 月額: $500（50,000リクエスト）

2. **Cambridge Dictionary API** (有料)
   - CEFR判定
   - 発音、音声

3. **代替案: 自前のCEFRデータベース**
   - 無料のCEFRリスト（約10,000語）
   - `vocabulary_reference`テーブルを作成

```sql
CREATE TABLE vocabulary_reference (
  word TEXT PRIMARY KEY,
  cefr_level TEXT NOT NULL,
  frequency_rank INT,
  in_wordlists TEXT[],
  part_of_speech TEXT,
  definition TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- データ投入（CSV importなど）
COPY vocabulary_reference(word, cefr_level, frequency_rank, in_wordlists)
FROM '/path/to/cefr_wordlist.csv'
WITH (FORMAT csv, HEADER true);
```

#### API設計

```python
# backend/app/api/routes/vocabulary.py
from fastapi import APIRouter, Depends

router = APIRouter()

@router.post("/api/analyze-vocabulary")
async def analyze_vocabulary(
    text: str,
    current_user = Depends(get_current_user)
):
    """
    テキストを解析して単語情報を返す
    """
    # 1. テキストをトークン化
    words = tokenize(text)

    # 2. 各単語の情報を取得
    results = []
    for word in words:
        info = await get_word_info(word)
        results.append({
            'word': word,
            'cefr_level': info.cefr_level,
            'frequency_rank': info.frequency_rank,
            'in_wordlists': info.in_wordlists,
            'is_known': await check_if_user_knows(current_user.id, word)
        })

    return {
        'total_words': len(words),
        'unique_words': len(set(words)),
        'words': results,
        'cefr_distribution': calculate_cefr_distribution(results)
    }
```

#### フロントエンド（UI）

```typescript
// frontend/src/components/features/VocabularyAnalysis/VocabularyAnalysis.tsx
interface VocabularyInfo {
  word: string
  cefr_level: string
  frequency_rank: number
  in_wordlists: string[]
  is_known: boolean
}

export function VocabularyAnalysis({ text }: { text: string }) {
  const [analysis, setAnalysis] = useState(null)

  const handleAnalyze = async () => {
    const result = await analyzeVocabulary(text)
    setAnalysis(result)
  }

  return (
    <div>
      <button onClick={handleAnalyze}>単語分析</button>

      {analysis && (
        <div>
          <h3>CEFR分布</h3>
          <CEFRChart distribution={analysis.cefr_distribution} />

          <h3>単語リスト</h3>
          {analysis.words.map((word) => (
            <div key={word.word} className={`word-${word.cefr_level}`}>
              <span>{word.word}</span>
              <span>{word.cefr_level}</span>
              <span>頻度: {word.frequency_rank}</span>
              {word.in_wordlists.length > 0 && (
                <span>{word.in_wordlists.join(', ')}</span>
              )}
              <button onClick={() => addToVocabulary(word)}>
                単語帳に追加
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

### フェーズ4: 単語帳・ストック機能

#### 機能概要

- カスタム単語帳作成
- タグ付け・カテゴリ分類
- 間隔反復学習（Spaced Repetition）
- 例文から音声生成

#### 間隔反復アルゴリズム（SM-2）

```typescript
// frontend/src/utils/spacedRepetition.ts
interface ReviewSchedule {
  interval: number // 次回復習までの日数
  easeFactor: number // 難易度（1.3-2.5）
  repetitions: number // 連続正解回数
}

export function calculateNextReview(
  current: ReviewSchedule,
  quality: number // 0-5 (0: 全く覚えていない, 5: 完璧)
): ReviewSchedule {
  let { interval, easeFactor, repetitions } = current

  // Ease Factorを更新
  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  )

  // Intervalを更新
  if (quality < 3) {
    // 不正解: リセット
    repetitions = 0
    interval = 1
  } else {
    // 正解
    repetitions++

    if (repetitions === 1) {
      interval = 1
    } else if (repetitions === 2) {
      interval = 6
    } else {
      interval = Math.round(interval * easeFactor)
    }
  }

  return {
    interval,
    easeFactor,
    repetitions,
  }
}
```

---

### フェーズ5: 音読練習統合

#### 機能概要

- 単語帳からカスタム音声教材作成
- ブックマークのみを音声化
- 習得度フィルター（星1-2のみ）
- プレイリスト機能

#### 実装例

```typescript
// frontend/src/components/features/CustomPlaylist/CustomPlaylist.tsx
export function CustomPlaylist() {
  const [bookmarks, setBookmarks] = useState([])
  const [filter, setFilter] = useState({ masteryLevel: [1, 2] })

  const handleGeneratePlaylist = async () => {
    // 1. ブックマークをフィルタリング
    const filtered = bookmarks.filter((b) =>
      filter.masteryLevel.includes(b.masteryLevel)
    )

    // 2. 文を結合
    const sentences = filtered.map((b) => b.sentenceText)
    const text = sentences.join(' ')

    // 3. 音声生成
    const { segment_urls, durations } = await performTTSSeparated(
      text,
      sentences,
      'alloy',
      'mp3'
    )

    // 4. AudioPlayerで再生
    setAudioSegments(segment_urls)
    setSegmentDurations(durations)
  }

  return (
    <div>
      <h2>カスタムプレイリスト</h2>

      <label>
        習得度フィルター:
        <select onChange={(e) => setFilter({ masteryLevel: [parseInt(e.target.value)] })}>
          <option value="1,2">要復習（星1-2）</option>
          <option value="3,4">習得中（星3-4）</option>
          <option value="5">習得済み（星5）</option>
        </select>
      </label>

      <button onClick={handleGeneratePlaylist}>
        音声プレイリスト生成
      </button>
    </div>
  )
}
```

---

## 実装ロードマップ

### 全体スケジュール（推定）

| フェーズ | タスク | 所要時間 | 優先度 |
|---------|-------|---------|-------|
| **フェーズ1** | Supabaseセットアップ・認証 | 1-2週間 | 🔴 最優先 |
| **フェーズ2** | データ移行・音声キャッシュ | 1週間 | 🔴 最優先 |
| **フェーズ3** | 単語分析機能 | 1週間 | 🟡 高優先 |
| **フェーズ4** | 単語帳・ストック機能 | 1週間 | 🟡 高優先 |
| **フェーズ5** | 音読練習統合 | 1週間 | 🟢 中優先 |

**合計: 5-7週間**

---

### フェーズ1: Supabaseセットアップ・認証（1-2週間）

#### ステップ1: Supabaseプロジェクト作成（1日）

1. https://supabase.com でアカウント作成
2. 新規プロジェクト作成
3. PostgreSQLデータベース自動設定
4. API keys取得

#### ステップ2: スキーマ設計・テーブル作成（1日）

```sql
-- 上記のスキーマ設計を実行
-- audio_cache, materials, bookmarks, learning_sessions, vocabulary
```

#### ステップ3: 認証UI実装（2-3日）

**ファイル:**
- `frontend/src/pages/Login.tsx`
- `frontend/src/pages/SignUp.tsx`
- `frontend/src/components/ProtectedRoute.tsx`

#### ステップ4: バックエンド認証統合（2-3日）

**ファイル:**
- `backend/app/core/auth.py`
- `backend/app/api/routes/auth.py`

#### ステップ5: localStorage → Supabase移行ツール（2日）

```typescript
// frontend/src/utils/migration.ts
export async function migrateLearningDataToSupabase() {
  // 1. localStorageからデータ取得
  const localData = LearningService.getLearningData()

  // 2. Supabaseに移行
  for (const session of localData.sessions) {
    await supabase.from('learning_sessions').insert({
      user_id: currentUser.id,
      start_time: session.startTime,
      end_time: session.endTime,
      play_count: session.playCount,
      // ...
    })
  }

  for (const bookmark of localData.bookmarks) {
    // 1. 教材を作成
    const { data: material } = await supabase.from('materials').insert({
      user_id: currentUser.id,
      title: bookmark.materialText.substring(0, 50),
      ocr_text: bookmark.materialText,
      sentences: bookmark.materialSentences,
    }).select().single()

    // 2. ブックマークを作成
    await supabase.from('bookmarks').insert({
      user_id: currentUser.id,
      material_id: material.id,
      sentence_index: bookmark.sentenceIndex,
      sentence_text: bookmark.sentenceText,
      mastery_level: bookmark.masteryLevel,
      note: bookmark.note,
    })
  }

  // 3. localStorageクリア
  localStorage.removeItem('tts_learning_data')
}
```

---

### フェーズ2: データ移行・音声キャッシュ（1週間）

#### ステップ1: Supabase Storage設定（1日）

1. Storageバケット作成: `audio-files`
2. 公開アクセス設定
3. CORS設定

#### ステップ2: 音声キャッシュサービス実装（2-3日）

**ファイル:**
- `backend/app/services/audio_cache_service.py`
- `backend/app/api/routes/tts.py`（更新）

#### ステップ3: フロントエンドAPI統合（2日）

**ファイル:**
- `frontend/src/services/api/tts.ts`（更新）

#### ステップ4: 既存機能のテスト（1日）

- 音声生成
- キャッシュヒット/ミス確認
- ブックマーク機能

---

### フェーズ3-5: 単語分析・単語帳・音読練習統合

（詳細は上記を参照）

---

## コスト見積もり

### Supabase（推奨プラン: Pro $25/月）

| 項目 | 無料枠 | Pro ($25/月) | 超過料金 |
|------|-------|-------------|---------|
| DB容量 | 500MB | 8GB | $0.125/GB/月 |
| ストレージ | 1GB | 100GB | $0.021/GB/月 |
| 帯域幅 | 5GB | 250GB | $0.09/GB |
| 月間アクティブユーザー | 50,000 | 無制限 | - |

**試算（100ユーザー、月100教材）:**
- DB: 100教材 × 10KB = 1MB（無料枠内）
- ストレージ: 100教材 × 30KB × 100文 = 300MB（無料枠内）
- 帯域幅: 100教材 × 30KB × 10再生 = 30MB（無料枠内）

**結論: 無料枠で十分。Pro ($25/月)は将来的に検討**

---

### Railway（バックエンド）

**現在**: $5/月（Hobby Plan）
**将来**: $20/月（Pro Plan）

---

### OpenAI TTS API

**料金**: $15 / 1M文字

**試算:**
- 1教材: 5,000文字
- 100教材: 500,000文字 = **$7.50**
- キャッシュ効率75%の場合: **$1.88/月**

---

### **合計月額コスト**

| 項目 | 現在 | 将来（Pro） |
|------|------|-----------|
| Supabase | $0 | $25 |
| Railway | $5 | $20 |
| OpenAI TTS | $2 | $5 |
| **合計** | **$7/月** | **$50/月** |

---

## 技術的な注意事項

### データ移行時の注意点

1. **localStorageからSupabaseへの移行**
   - 移行完了後もlocalStorageを一定期間保持（バックアップ）
   - 移行フラグを設定（`migration_completed: true`）

2. **既存ブックマークの互換性**
   - 新しいフィールド（`materialId`, `sentenceIndex`）が存在しない場合の処理

### パフォーマンス最適化

1. **音声キャッシュの最適化**
   - CDN統合（Cloudflare, CloudFront）
   - Lazy Loading（必要な文だけ先読み）

2. **データベースクエリ最適化**
   - インデックスの追加
   - N+1問題の回避

### セキュリティ

1. **Row Level Security（RLS）**
   - 全テーブルで有効化
   - ユーザーは自分のデータのみアクセス可能

2. **API Rate Limiting**
   - FastAPIのレート制限維持
   - Supabase側でも設定可能

---

## 次回セッションでの参照方法

### このドキュメントの活用

1. **セッション開始時**
   - `docs/FUTURE_EXPANSION_PLAN.md`を読む
   - 現在のフェーズを確認

2. **実装時**
   - データベーススキーマをコピー&ペースト
   - 実装コード例を参考にする

3. **判断時**
   - ロードマップを確認
   - コスト見積もりを参照

---

## 更新履歴

| 日付 | バージョン | 変更内容 |
|------|----------|---------|
| 2025-11-05 | 1.0 | 初版作成 |

---

**このドキュメントは、プロジェクトの進化に合わせて随時更新してください。**
