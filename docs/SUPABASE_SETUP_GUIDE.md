# Supabase セットアップガイド

**作成日**: 2025-11-08
**対象**: TTS学習アプリのSupabase移行
**所要時間**: 約30分

---

## 📋 目次

1. [前提条件](#前提条件)
2. [ステップ1: Supabaseアカウント作成](#ステップ1-supabaseアカウント作成)
3. [ステップ2: プロジェクト作成](#ステップ2-プロジェクト作成)
4. [ステップ3: データベーススキーマ作成](#ステップ3-データベーススキーマ作成)
5. [ステップ4: RLSポリシー設定](#ステップ4-rlsポリシー設定)
6. [ステップ5: Storageバケット作成](#ステップ5-storageバケット作成)
7. [ステップ6: API Keys取得](#ステップ6-api-keys取得)
8. [ステップ7: 環境変数設定](#ステップ7-環境変数設定)
9. [トラブルシューティング](#トラブルシューティング)

---

## 前提条件

- [ ] Googleアカウント、GitHubアカウント、またはメールアドレス
- [ ] ブラウザ（Chrome、Firefox、Edge等）

---

## ステップ1: Supabaseアカウント作成

### 1.1 Supabaseサイトにアクセス

https://supabase.com にアクセスします。

### 1.2 サインアップ

1. **「Start your project」** をクリック
2. 以下のいずれかでサインアップ:
   - **GitHub** （推奨）
   - **Google**
   - **Email**

### 1.3 メール認証（Email選択時のみ）

登録したメールアドレスに認証メールが送信されます。メール内のリンクをクリックして認証してください。

---

## ステップ2: プロジェクト作成

### 2.1 新規プロジェクト作成

1. ダッシュボードで **「New project」** をクリック
2. 以下の情報を入力:

| 項目 | 入力内容 | 説明 |
|------|---------|------|
| **Organization** | 既存組織を選択、または新規作成 | 個人用なら「Personal」でOK |
| **Name** | `tts-learning-app` | プロジェクト名（任意） |
| **Database Password** | 強力なパスワード | **必ずメモしてください** |
| **Region** | `Northeast Asia (Tokyo)` | 日本から最も近いリージョン |
| **Pricing Plan** | `Free` | 無料枠（500MB DB、1GB Storage） |

3. **「Create new project」** をクリック

### 2.2 プロジェクト作成完了を待つ

約1-2分で完了します。画面に「Project is ready」と表示されるまで待機してください。

---

## ステップ3: データベーススキーマ作成

### 3.1 SQL Editorを開く

1. 左サイドバーの **「SQL Editor」** をクリック
2. **「+ New query」** をクリック

### 3.2 スキーマSQLを実行

1. プロジェクトフォルダの `database/schema.sql` を開く
2. 全文をコピー
3. Supabase SQL Editorにペースト
4. **「Run」** ボタンをクリック

### 3.3 実行結果を確認

```
✅ TTS学習アプリ - データベーススキーマ作成完了
次のステップ: rls_policies.sql を実行してください
```

このメッセージが表示されればOKです。

### 3.4 テーブル確認

1. 左サイドバーの **「Table Editor」** をクリック
2. 以下のテーブルが作成されていることを確認:
   - `audio_cache`
   - `materials`
   - `bookmarks`
   - `learning_sessions`
   - `vocabulary`

---

## ステップ4: RLSポリシー設定

### 4.1 SQL Editorで新規クエリを作成

1. SQL Editorに戻る
2. **「+ New query」** をクリック

### 4.2 RLSポリシーSQLを実行

1. プロジェクトフォルダの `database/rls_policies.sql` を開く
2. 全文をコピー
3. Supabase SQL Editorにペースト
4. **「Run」** ボタンをクリック

### 4.3 実行結果を確認

```
✅ TTS学習アプリ - RLSポリシー設定完了

設定されたポリシー:
  - materials: ユーザーごとに分離
  - bookmarks: ユーザーごとに分離
  - learning_sessions: ユーザーごとに分離
  - vocabulary: ユーザーごとに分離
  - audio_cache: 全ユーザー共有（バックエンドのみ書き込み）

次のステップ: Supabase Storageバケット作成
```

### 4.4 RLS確認

1. **「Authentication」** → **「Policies」** をクリック
2. 各テーブルに4つのポリシー（SELECT, INSERT, UPDATE, DELETE）が設定されていることを確認

---

## ステップ5: Storageバケット作成

### 5.1 Storageページを開く

左サイドバーの **「Storage」** をクリック

### 5.2 新規バケット作成

1. **「Create a new bucket」** をクリック
2. 以下を入力:

| 項目 | 入力内容 |
|------|---------|
| **Name** | `audio-files` |
| **Public bucket** | ✅ チェックを入れる（音声ファイルを公開） |

3. **「Create bucket」** をクリック

### 5.3 CORS設定（オプション）

1. 作成した `audio-files` バケットをクリック
2. **「Configuration」** タブをクリック
3. **「CORS configuration」** で以下を追加:

```json
[
  {
    "allowedOrigins": ["*"],
    "allowedMethods": ["GET", "HEAD"],
    "allowedHeaders": ["*"],
    "maxAgeSeconds": 3600
  }
]
```

4. **「Save」** をクリック

---

## ステップ6: API Keys取得

### 6.1 Project Settingsを開く

1. 左サイドバーの **「Settings」** （歯車アイコン）をクリック
2. **「API」** をクリック

### 6.2 URLとKeysをコピー

以下の3つの情報をメモ帳などにコピーしてください:

| 項目 | 説明 | 使用場所 |
|------|------|---------|
| **Project URL** | `https://xxxxx.supabase.co` | フロントエンド・バックエンド |
| **anon public** | 匿名キー（公開可能） | フロントエンド |
| **service_role** | サービスロールキー（**絶対に公開しない**） | バックエンドのみ |

⚠️ **重要**: `service_role` キーは絶対にGitHubにコミットしないでください。RLS制限を無視できる強力なキーです。

---

## ステップ7: 環境変数設定

### 7.1 フロントエンド設定

1. `frontend/.env.example` をコピーして `frontend/.env` を作成
2. 以下を入力:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_DEBUG=true
```

### 7.2 バックエンド設定

1. `backend/.env.example` をコピーして `backend/.env` を作成
2. 以下を追加:

```env
# ... 既存の設定（OPENAI_API_KEY等）

SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
SUPABASE_ANON_KEY=your_anon_key_here
```

### 7.3 .gitignoreを確認

`.env` ファイルが `.gitignore` に含まれていることを確認してください:

```gitignore
# .gitignore
.env
frontend/.env
backend/.env
```

---

## トラブルシューティング

### 問題1: SQL実行時にエラーが出る

**症状**: `ERROR: relation "auth.users" does not exist`

**原因**: Supabase Authが有効化されていない

**解決方法**:
1. **「Authentication」** → **「Settings」** をクリック
2. **「Enable authentication」** をオンにする
3. スキーマSQLを再実行

---

### 問題2: RLSポリシーが機能しない

**症状**: 他のユーザーのデータが見える

**原因**: RLSが有効化されていない

**解決方法**:
1. SQL Editorで以下を実行:
```sql
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;
```

---

### 問題3: Storageにアクセスできない

**症状**: 音声ファイルの取得で403エラー

**原因**: バケットが非公開に設定されている

**解決方法**:
1. **「Storage」** → `audio-files` → **「Configuration」**
2. **「Public bucket」** をオンにする

---

## 次のステップ

Supabaseセットアップが完了しました！次は以下のステップに進んでください:

1. **Supabaseクライアント統合** (フロントエンド)
   - `frontend/src/services/supabase/supabaseClient.ts` 作成
   - 認証機能実装

2. **Supabase認証ミドルウェア** (バックエンド)
   - `backend/app/core/supabase.py` 作成
   - JWTトークン検証実装

3. **データ移行ツール**
   - localStorage → Supabase 移行スクリプト作成

---

## 参考リンク

- [Supabase公式ドキュメント](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage](https://supabase.com/docs/guides/storage)

---

**セットアップに関する質問があれば、次回セッションで対応します。**
