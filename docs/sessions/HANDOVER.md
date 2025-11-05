# 開発ハンドオーバー記録

> このファイルには最新のセッション情報のみを記載します。
> 過去のセッション履歴は [SESSION_HISTORY.md](SESSION_HISTORY.md) を参照してください。

---

## セッション #26 - 2025-11-05（✅ 完了）

### 実施内容

このセッションでは、**ブックマーク音声再生機能の実装**と**今後の拡張設計書（Supabase移行計画）の作成**を行いました。

#### 1. CORS設定の修正

**問題**: フロントエンドが port 5175 で起動したが、バックエンド CORS設定に port 5175 が含まれていなかった

**エラー**:
```
Access to fetch at 'http://localhost:8000/api/ocr' from origin 'http://localhost:5175' has been blocked by CORS policy
```

**解決**:
- `backend/.env` の CORS_ORIGINS に `http://localhost:5175` を追加
- 古いPythonプロセス（PID 9040, 18644）をkilして設定を反映
- curl で CORS Preflightリクエストを確認（`Access-Control-Allow-Origin: http://localhost:5175` 確認）

**変更ファイル**: `backend/.env`

#### 2. ブックマーク音声再生機能の実装

**背景**: ユーザーからの質問「ブックマークからのシークというのは、そこから新しく音声を生成しなおす、というフローなのでしょうか」

**設計判断**:
- **Approach 1**: 現在のセッション内でのみシーク（簡単、10分）
- **Approach 2**: 教材データを保存して音声再生成（複雑、1-2時間、将来拡張に有利）
- **ユーザー選択**: 「保存する方式にしましょう」→ Approach 2 を採用

**実装内容**:

##### A. Bookmark型の拡張

**変更ファイル**: `frontend/src/types/learning.ts`

**追加プロパティ**:
```typescript
export interface Bookmark {
  // 既存プロパティ
  bookmarkId: string
  sentenceId: string
  sentenceText: string
  addedAt: string
  practiceCount: number
  lastPracticedAt: string | null
  masteryLevel: 1 | 2 | 3 | 4 | 5
  note: string

  // 新規追加: 教材データ（音声再生用）
  sentenceIndex: number        // 文のインデックス
  materialId: string           // 教材ID（SHA-256ハッシュ）
  materialText: string         // 教材の全文
  materialSentences: string[]  // 教材の全文リスト
}
```

##### B. BookmarkService の修正

**変更ファイル**: `frontend/src/services/learning/bookmarkService.ts`

**変更箇所**:
- `addBookmark()` のシグネチャ変更（sentenceIndex, materialText, materialSentences を追加）
- `toggleBookmark()` のシグネチャ変更（同上）
- materialId 生成（SHA-256ハッシュ）
- localStorage への永続化

**実装例**:
```typescript
static addBookmark(
  sentenceText: string,
  sentenceIndex: number,      // NEW
  materialText: string,        // NEW
  materialSentences: string[]  // NEW
): Bookmark | null {
  const materialId = hashString(materialText)
  // ... ブックマーク作成と保存
}
```

##### C. SentenceList の修正

**変更ファイル**: `frontend/src/components/features/SentenceList/SentenceList.tsx`

**変更箇所**:
- Props に `materialText: string` を追加
- `handleBookmarkToggle()` で materialText と index を BookmarkService に渡す

##### D. AudioPlayer の修正

**変更ファイル**: `frontend/src/components/features/AudioPlayer/AudioPlayer.tsx`

**変更箇所**:
- Props に `sourceText?: string` を追加
- SentenceList に `materialText={sourceText || ''}` を渡す

##### E. App.tsx への統合

**変更ファイル**: `frontend/src/App.tsx`

**実装内容**:
- `handleBookmarkPlay()` 関数を作成（materialText, materialSentences, sentenceIndex を受け取る）
- ブックマークから教材データを復元
- `handleGenerateSpeech()` で音声を再生成
- `setCurrentSentenceIndex()` で該当文にシーク
- BookmarkList に `onBookmarkPlay` prop を渡す

**実装例**:
```typescript
const handleBookmarkPlay = async (
  materialText: string,
  materialSentences: string[],
  sentenceIndex: number
) => {
  setShowBookmarkList(false)

  // 音声URLをリセット
  if (audioUrl && audioUrl !== 'separated') {
    URL.revokeObjectURL(audioUrl)
  }

  // 教材データを復元
  setOcrText(materialText)
  setOcrSentences(materialSentences)
  setOriginalOcrSentences(materialSentences)

  // 音声を再生成
  await handleGenerateSpeech(materialText)

  // 該当文にシーク
  setCurrentSentenceIndex(sentenceIndex)
}
```

##### F. BookmarkList への再生ボタン追加

**変更ファイル**: `frontend/src/components/features/BookmarkList/BookmarkList.tsx`, `styles.css`

**実装内容**:
- Props に `onBookmarkPlay` を追加
- 各ブックマークカードに「🔊 この文から音声再生」ボタンを追加
- ボタンクリックで `onBookmarkPlay()` を呼び出す

**スタイル**:
```css
.play-bookmark-button {
  width: 100%;
  padding: 10px 16px;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
```

**テスト結果**: ユーザー確認「正常に動作しました！」✅

#### 3. 今後の拡張設計書の作成（Supabase移行計画）

**背景**: ユーザーの長期ビジョン
- 英語学習を効率化するための総合的なアプリ
- CEFR単語レベル分析
- 単語帳掲載情報の即時表示
- 単語・表現・構文のストック管理
- スムーズな音読練習への接続

**ユーザー質問**: 「現在の構成からこれらの機能への拡張は可能でしょうか」

**設計判断**:
- アカウント機能が必要
- OCR結果・TTS生成結果のユーザーごと保存が必要
- localStorage（5-10MB）では容量不足
- バックエンドDB（Supabase）への移行が最適

**音声保存の判断**:
- **ユーザー質問**: 「アカウント機能導入後もTTSは再生成する形が良いでしょうか。それとも一度生成した音声は保存しておくことで再生成をスキップすることはできないでしょうか？」
- **回答**: 音声キャッシュ機構で26倍のコスト削減が可能
- **ユーザー決定**: 「保存する方式にしましょう」

**ファイル**: `docs/FUTURE_EXPANSION_PLAN.md` (約1,200行)

**内容**:

##### 1. プロジェクトビジョン
- ターゲットユーザー: 高校生、大学受験生、英語学習者
- 目標: 総合的な英語学習プラットフォーム
- コア価値: OCR + TTS + 学習管理 + 語彙分析

##### 2. 現在のアーキテクチャ分析
- フロントエンド: React + TypeScript + Vite（Vercel）
- バックエンド: FastAPI + Python（Railway）
- ストレージ: localStorage（5-10MB）
- 認証: なし
- データベース: なし

##### 3. Supabase移行の理由
- PostgreSQL（無制限ストレージ）
- Authentication（メール、Google、GitHub）
- Storage（音声ファイル保存）
- Real-time（将来のコラボ機能）
- Row Level Security（マルチユーザー対応）
- 無料枠: 500MB DB、1GB Storage、2GB bandwidth/月

**代替案の比較**:
- Firebase: NoSQL（複雑なクエリに弱い）、ベンダーロックイン
- MongoDB Atlas: セットアップ複雑、コスト高
- Supabase: PostgreSQL、オープンソース、コスパ最高

##### 4. データベース設計

**テーブル構成**:

```sql
-- 1. ユーザー（Supabase Auth自動管理）
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. 音声キャッシュ（全ユーザー共有）
CREATE TABLE audio_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hash_key TEXT UNIQUE NOT NULL,  -- SHA-256(text + voice + format)
  audio_url TEXT NOT NULL,         -- Supabase Storage URL
  duration_seconds DECIMAL NOT NULL,
  format TEXT NOT NULL,
  voice TEXT NOT NULL,
  text_preview TEXT,
  file_size_bytes BIGINT,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. 教材（ユーザーごと）
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  sentences TEXT[] NOT NULL,
  audio_cache_id UUID REFERENCES audio_cache(id),
  created_at TIMESTAMP DEFAULT NOW(),
  last_practiced_at TIMESTAMP
);

-- 4. ブックマーク（ユーザーごと）
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  sentence_index INTEGER NOT NULL,
  sentence_text TEXT NOT NULL,
  mastery_level INTEGER CHECK (mastery_level BETWEEN 1 AND 5),
  note TEXT,
  practice_count INTEGER DEFAULT 0,
  last_practiced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, material_id, sentence_index)
);

-- 5. 学習セッション（ユーザーごと）
CREATE TABLE learning_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  material_id UUID REFERENCES materials(id) ON DELETE SET NULL,
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  duration_seconds INTEGER,
  sentence_count INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. 語彙ストック（将来拡張用）
CREATE TABLE vocabulary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  definition TEXT,
  example_sentence TEXT,
  cefr_level TEXT CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  mastery_level INTEGER CHECK (mastery_level BETWEEN 1 AND 5),
  next_review_date DATE,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, word)
);
```

**Row Level Security (RLS)**:
```sql
-- 各テーブルでユーザー自身のデータのみアクセス可能
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own materials"
  ON materials FOR ALL
  USING (auth.uid() = user_id);
```

##### 5. 音声キャッシュ機構

**キャッシュキー生成**:
```typescript
async function generateCacheKey(
  text: string,
  voice: string,
  format: string
): Promise<string> {
  const data = `${text}-${voice}-${format}`
  const hashBuffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(data)
  )
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
```

**キャッシュ検索フロー**:
1. TTS生成リクエスト受信
2. SHA-256ハッシュ生成
3. audio_cache テーブルで検索
4. キャッシュヒット → Supabase Storage から音声取得（0.001秒）
5. キャッシュミス → OpenAI TTS生成 → Supabase Storage に保存 → audio_cache に登録

**コスト削減効果**:
- OpenAI TTS API: $15/1M文字
- 平均教材: 500文字 → $0.0075/回
- キャッシュヒット率: 50%と仮定
- 100人のユーザー、各10教材 → 1,000回生成
- キャッシュなし: 1,000回 × $0.0075 = $7.50
- キャッシュあり: 500回（ミス）× $0.0075 = $3.75 + $0.0038（ストレージ1GB）= $3.75
- **削減率: 50%**（実際のヒット率が高ければ更に削減）

##### 6. 認証システム実装

**フロントエンド（TypeScript）**:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// サインアップ
async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  return { data, error }
}

// ログイン
async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

// ログアウト
async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// 現在のユーザー取得
function getCurrentUser() {
  return supabase.auth.getUser()
}
```

**保護されたルート**:
```typescript
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" />

  return <>{children}</>
}
```

**バックエンド（FastAPI）**:
```python
from fastapi import Depends, HTTPException
from supabase import create_client

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")  # Service role key
)

async def get_current_user(
    authorization: str = Header(None)
) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Unauthorized")

    token = authorization.split(" ")[1]
    user = supabase.auth.get_user(token)

    if not user:
        raise HTTPException(401, "Invalid token")

    return user

@app.post("/api/materials")
async def create_material(
    request: MaterialRequest,
    user: dict = Depends(get_current_user)
):
    # user.id を使ってDBに保存
    pass
```

##### 7. 将来の機能拡張

**A. CEFR語彙分析**
- テキスト解析エンドポイント `/api/analyze-vocabulary`
- CEFR辞書との照合（A1-C2レベル判定）
- 単語帳データベース統合（ターゲット、鉄壁、シス単等）
- UI: 単語ごとのハイライト、難易度マーカー

**B. 単語ストック管理**
- 「覚えたい」単語を保存
- メモ、用例文追加
- フラッシュカード表示
- 習得度管理（1-5段階）

**C. 間隔反復学習（Spaced Repetition）**
- SM-2アルゴリズム実装
- 復習スケジュール自動生成
- プッシュ通知（復習時間）

**D. カスタムプレイリスト**
- ブックマークから練習セット作成
- 難易度別、テーマ別にグループ化
- 連続再生モード

##### 8. 実装ロードマップ

**フェーズ1: Supabase基盤構築（1週間）**
- Supabaseプロジェクト作成
- データベーススキーマ作成
- RLS ポリシー設定
- フロントエンド Supabase クライアント統合

**フェーズ2: 認証システム（1週間）**
- サインアップ/ログインUI
- 保護されたルート実装
- バックエンド認証ミドルウェア
- localStorage → Supabase移行ツール

**フェーズ3: 音声キャッシュ（1週間）**
- audio_cache テーブル実装
- キャッシュ検索ロジック
- Supabase Storage統合
- TTS生成エンドポイント修正

**フェーズ4: データ移行（1週間）**
- materials, bookmarks, learning_sessions テーブル実装
- 既存機能のSupabase対応
- データ同期テスト

**フェーズ5: 新機能開発（1-2週間）**
- CEFR語彙分析
- 単語ストック管理
- 間隔反復学習（オプション）

**合計**: 5-7週間

##### 9. コスト見積もり

**開発初期（100ユーザー想定）**:
- Supabase: 無料枠（500MB DB、1GB Storage）
- Railway (バックエンド): $5/月
- Vercel (フロントエンド): 無料
- OpenAI TTS API: ~$5/月（音声キャッシュあり）
- **合計**: $10/月以下

**スケール時（1,000ユーザー想定）**:
- Supabase Pro: $25/月（8GB DB、100GB Storage）
- Railway: $20/月（増強）
- Vercel Pro: $20/月
- OpenAI TTS API: ~$20/月（キャッシュヒット率75%）
- **合計**: $85/月

**キャッシュなしの場合**:
- OpenAI TTS API: ~$500/月（全生成）
- **削減額**: $480/月（96%削減）

---

### 技術的決定事項

#### 決定1: Bookmark型に教材データを含める

**理由**:
- 音声再生成に必要な全データ（materialText, materialSentences）を保存
- 将来のDB移行時に materialId が外部キーとして使える
- SHA-256ハッシュで一意性を保証

#### 決定2: Supabase を採用（Firebase, MongoDB ではなく）

**理由**:
- PostgreSQL（リレーショナルDB、複雑なクエリ対応）
- オープンソース（ベンダーロックイン回避）
- 認証・ストレージ・リアルタイム統合
- コスパ最高（無料枠が充実）
- Row Level Security（セキュリティ強固）

**代替案**:
- Firebase: NoSQL、JOIN弱い、コスト高
- MongoDB Atlas: セットアップ複雑、学習コスト高

#### 決定3: 音声キャッシュ機構の導入

**理由**:
- OpenAI TTS APIコストを50-96%削減
- ユーザー間で音声を共有（同じテキストは1回だけ生成）
- レスポンス速度向上（キャッシュヒット時は即座に返却）

**実装**:
- SHA-256ハッシュでキャッシュキー生成
- audio_cache テーブルで管理
- Supabase Storage に音声ファイル保存
- access_count で人気コンテンツを追跡

---

### 次セッションへの引き継ぎ事項

#### すぐに着手できるタスク

1. **📋 ユーザーの設計書レビュー**（最優先）
   - `docs/FUTURE_EXPANSION_PLAN.md` をレビュー
   - Supabase移行計画、データベース設計、実装ロードマップの確認
   - 承認後、フェーズ1（Supabase基盤構築）開始判断

2. **🚀 Supabaseアカウント作成**（承認後）
   - https://supabase.com でアカウント作成
   - 新規プロジェクト作成
   - API Keys取得（anon key, service role key）

3. **🗄️ データベーススキーマ作成**（承認後）
   - Supabase SQLエディタで DDL実行
   - RLS ポリシー設定
   - テストデータ投入

4. **🔐 認証システム実装**（承認後）
   - フロントエンド: Supabase Auth統合
   - バックエンド: 認証ミドルウェア実装
   - サインアップ/ログインUI作成

#### 注意事項

- **設計書の完成度**: 1,200行の詳細設計で実装時の判断コストを削減
- **段階的移行**: ローカルストレージ版を維持しつつ、Supabase版を並行開発
- **データ移行ツール**: localStorage → Supabase への自動移行スクリプトが必要
- **コスト管理**: 無料枠（500MB DB、1GB Storage）を超えないよう監視

#### 参考ドキュメント

**次回セッションで参照すべきファイル**:
- `docs/FUTURE_EXPANSION_PLAN.md` - Supabase移行計画、データベース設計
- Supabase公式ドキュメント: https://supabase.com/docs
- Supabase Auth with React: https://supabase.com/docs/guides/auth/auth-helpers/auth-ui
- Row Level Security: https://supabase.com/docs/guides/auth/row-level-security

---

### 成果物リスト

#### 新規作成ファイル
- [x] `docs/FUTURE_EXPANSION_PLAN.md` - 今後の拡張設計書（約1,200行）

#### 更新ファイル
- [x] `frontend/src/types/learning.ts` - Bookmark型拡張（materialId, materialText等追加）
- [x] `frontend/src/services/learning/bookmarkService.ts` - addBookmark/toggleBookmark修正
- [x] `frontend/src/components/features/SentenceList/SentenceList.tsx` - materialText prop追加
- [x] `frontend/src/components/features/AudioPlayer/AudioPlayer.tsx` - sourceText prop追加
- [x] `frontend/src/App.tsx` - handleBookmarkPlay実装
- [x] `frontend/src/components/features/BookmarkList/BookmarkList.tsx` - 再生ボタン追加
- [x] `frontend/src/components/features/BookmarkList/styles.css` - 再生ボタンスタイル追加
- [x] `backend/.env` - CORS_ORIGINS に port 5175 追加
- [x] `docs/sessions/TODO.md` - セッション#25-26完了マーク
- [x] `docs/sessions/HANDOVER.md` - セッション#26記録
- [x] `docs/sessions/SESSION_HISTORY.md` - セッション#24-25アーカイブ

#### Git commits
- [ ] セッション#26の完全実装コミット作成（次回実施）
