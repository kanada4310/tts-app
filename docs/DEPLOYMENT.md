# デプロイガイド

## 概要

このドキュメントでは、TTS App（OCR & Text-to-Speech Application）をVercel（フロントエンド）とRailway（バックエンド）にデプロイする手順を説明します。

## アーキテクチャ

```
[ユーザー（生徒）]
     ↓ HTTPS
[Vercel - フロントエンド]
     ↓ API Call (HTTPS)
[Railway - バックエンド]
     ↓
[Gemini API] [OpenAI API]
```

## デプロイ構成

### フロントエンド: Vercel
- **URL**: `https://your-app-name.vercel.app`
- **プラン**: Hobby（無料）
- **自動デプロイ**: GitHubのmasterブランチへのpush時
- **ビルドコマンド**: `npm run build`
- **出力ディレクトリ**: `dist`

### バックエンド: Railway
- **URL**: `https://your-backend.railway.app`
- **プラン**: Hobby（$5/月、初回$5クレジット付与）
- **自動デプロイ**: GitHubのmasterブランチへのpush時
- **起動コマンド**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

## 必要な準備

### 1. APIキーの取得

以下のAPIキーを事前に取得してください:

- **Gemini API Key**: [Google AI Studio](https://makersuite.google.com/app/apikey)で取得
- **OpenAI API Key**: [OpenAI Platform](https://platform.openai.com/api-keys)で取得

### 2. GitHubリポジトリ

- リポジトリが既にpush済みであることを確認
- masterブランチが最新であることを確認

## デプロイ手順

### ステップ1: バックエンドをRailwayにデプロイ

#### 1.1 Railwayアカウント作成
1. [Railway](https://railway.app/)にアクセス
2. 「Start a New Project」をクリック
3. GitHubアカウントでサインアップ/ログイン

#### 1.2 プロジェクト作成
1. 「New Project」→「Deploy from GitHub repo」を選択
2. TTS リポジトリを選択
3. 「Deploy Now」をクリック

#### 1.3 バックエンド設定
1. デプロイされたサービスをクリック
2. 「Settings」タブを開く
3. **Root Directory**を設定: `backend`
4. **Start Command**を設定: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

#### 1.4 環境変数設定
1. 「Variables」タブを開く
2. 以下の環境変数を追加:

```
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
PORT=8000
```

#### 1.5 デプロイURLの確認
1. 「Settings」→「Networking」→「Public Networking」
2. 生成されたURLをコピー（例: `https://tts-backend-production-xxxx.railway.app`）

### ステップ2: フロントエンドをVercelにデプロイ

#### 2.1 Vercelアカウント作成
1. [Vercel](https://vercel.com/)にアクセス
2. 「Sign Up」をクリック
3. GitHubアカウントでサインアップ/ログイン

#### 2.2 プロジェクトインポート
1. 「Add New...」→「Project」を選択
2. 「Import Git Repository」でTTSリポジトリを選択
3. 「Import」をクリック

#### 2.3 プロジェクト設定
1. **Framework Preset**: Vite
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`

#### 2.4 環境変数設定
1. 「Environment Variables」セクションを開く
2. 以下を追加:

```
VITE_API_BASE_URL=https://tts-backend-production-xxxx.railway.app
```

※ `https://tts-backend-production-xxxx.railway.app`は、ステップ1.5で取得したRailwayのURLに置き換えてください

#### 2.5 デプロイ実行
1. 「Deploy」ボタンをクリック
2. デプロイ完了を待つ（2〜3分）
3. 生成されたURL（例: `https://tts-app.vercel.app`）にアクセスして動作確認

### ステップ3: バックエンドのCORS設定更新

デプロイ後、バックエンドでフロントエンドのURLを許可する必要があります。

1. `backend/app/core/config.py`を編集:

```python
# Vercel URLを追加
cors_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "https://tts-app.vercel.app",  # ← あなたのVercel URLに置き換え
]
```

2. GitHubにpush:

```bash
git add backend/app/core/config.py
git commit -m "Add Vercel URL to CORS origins"
git push origin master
```

3. Railwayが自動的に再デプロイします

## デプロイ後の確認

### 動作確認チェックリスト

1. **フロントエンド**
   - [ ] Vercel URLにアクセスできる
   - [ ] ページが正常に表示される
   - [ ] コンソールエラーがない

2. **バックエンド**
   - [ ] Railway URLにアクセスできる
   - [ ] `https://your-backend.railway.app/docs`でAPI docsが表示される
   - [ ] ヘルスチェックが成功する

3. **統合テスト**
   - [ ] 画像アップロードが成功する
   - [ ] OCRが正常に動作する
   - [ ] TTS音声生成が成功する
   - [ ] 音声再生が正常に動作する
   - [ ] ポーズ機能が動作する

## トラブルシューティング

### エラー: CORS Policy Error

**原因**: フロントエンドのURLがバックエンドのCORS設定に含まれていない

**解決方法**:
1. `backend/app/core/config.py`のcors_originsにVercel URLを追加
2. GitHubにpush
3. Railwayの自動再デプロイを待つ

### エラー: 500 Internal Server Error（バックエンド）

**原因**: 環境変数が正しく設定されていない

**解決方法**:
1. Railwayの「Variables」タブで環境変数を確認
2. `GEMINI_API_KEY`と`OPENAI_API_KEY`が正しく設定されているか確認
3. 設定を変更した場合、手動で再デプロイ

### エラー: 404 Not Found（フロントエンド）

**原因**: ルーティング設定が不正

**解決方法**:
1. Vercelの「Settings」→「Rewrites」を確認
2. SPAルーティングが正しく設定されているか確認

### バックエンドのログ確認方法

Railway:
1. プロジェクトを開く
2. 「Deployments」タブ
3. 最新のデプロイをクリック
4. 「View Logs」でログを確認

### フロントエンドのログ確認方法

Vercel:
1. プロジェクトを開く
2. 「Deployments」タブ
3. 最新のデプロイをクリック
4. 「Logs」タブでログを確認

## コスト見積もり

### 月額コスト（想定）

| サービス | プラン | 月額コスト |
|---------|--------|-----------|
| Vercel | Hobby | $0 |
| Railway | Hobby | $5 |
| Gemini API | 従量課金 | ~$1-3 |
| OpenAI TTS API | 従量課金 | ~$2-5 |
| **合計** | | **$8-13** |

### API使用量の目安

- **Gemini API（OCR）**: $0.00025/リクエスト
  - 100枚/日 → 月$7.5
  - 10枚/日 → 月$0.75

- **OpenAI TTS API**: $15/100万文字
  - 1000文/日（平均300文字/文） → 月$13.5
  - 100文/日 → 月$1.35

## 継続的デプロイ（CI/CD）

### 自動デプロイの仕組み

1. **masterブランチへのpush**
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin master
   ```

2. **自動デプロイ開始**
   - Vercel: フロントエンドを自動ビルド＆デプロイ
   - Railway: バックエンドを自動ビルド＆デプロイ

3. **デプロイ完了通知**
   - VercelとRailwayから完了メールが届く
   - 通常2〜5分で完了

### ブランチ戦略（推奨）

本番運用を開始したら、以下のブランチ戦略を推奨:

```
master (本番環境)
  ↑
develop (開発環境)
  ↑
feature/* (機能開発)
```

- `feature/*`: 新機能開発
- `develop`: 開発環境（Railway/Vercelのプレビュー環境）
- `master`: 本番環境（生徒が使用）

## セキュリティ

### APIキーの管理

- ✅ **DO**: 環境変数で管理（Vercel/Railway）
- ❌ **DON'T**: コードにハードコードしない
- ❌ **DON'T**: GitHubにコミットしない

### HTTPS

- Vercel: 自動的にHTTPS化
- Railway: 自動的にHTTPS化

### レート制限

バックエンドには既にレート制限が実装済み:
- `/api/ocr`: 10リクエスト/分
- `/api/tts`: 5リクエスト/分

## メンテナンス

### ログの確認

定期的にログを確認してエラーを監視:
- **Railway**: 「Deployments」→「View Logs」
- **Vercel**: 「Deployments」→「Logs」

### モニタリング

Railwayのダッシュボードで以下を監視:
- CPU使用率
- メモリ使用率
- ネットワーク帯域幅
- API使用量

### バックアップ

- GitHubリポジトリが自動的にバックアップとして機能
- 定期的にmasterブランチをpull

## 生徒への共有

デプロイ完了後、以下の情報を生徒に共有:

1. **アプリのURL**: `https://your-app-name.vercel.app`
2. **使い方ガイド**: `docs/USER_GUIDE.md`（次のステップで作成）
3. **サポート連絡先**: あなたのメールアドレスやSlackチャンネル

## 次のステップ

1. ✅ デプロイ設計ドキュメント作成（完了）
2. ⏳ デプロイ実施
3. ⏳ 動作確認
4. ⏳ 生徒向け使用ガイド作成（`docs/USER_GUIDE.md`）
5. ⏳ 生徒への共有

## 参考リンク

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [OpenAI TTS Documentation](https://platform.openai.com/docs/guides/text-to-speech)
