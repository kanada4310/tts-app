# デプロイチェックリスト

このチェックリストに従って、順番にデプロイを進めてください。

## 事前準備

### 1. APIキーの取得
- [ ] Gemini API Key取得（[Google AI Studio](https://makersuite.google.com/app/apikey)）
- [ ] OpenAI API Key取得（[OpenAI Platform](https://platform.openai.com/api-keys)）
- [ ] APIキーをメモ帳などに保存（後で使用）

### 2. アカウント作成
- [ ] GitHubアカウント確認（既存）
- [ ] Railwayアカウント作成（[Railway](https://railway.app/)）
- [ ] Vercelアカウント作成（[Vercel](https://vercel.com/)）

### 3. リポジトリ確認
- [ ] GitHubにリポジトリがpush済みであることを確認
- [ ] masterブランチが最新であることを確認

## ステップ1: バックエンドデプロイ（Railway）

### 1.1 プロジェクト作成
- [ ] Railwayにログイン
- [ ] 「New Project」→「Deploy from GitHub repo」を選択
- [ ] TTSリポジトリを選択して「Deploy Now」をクリック

### 1.2 設定
- [ ] デプロイされたサービスをクリック
- [ ] 「Settings」タブを開く
- [ ] **Root Directory**を`backend`に設定
- [ ] **Start Command**を`uvicorn app.main:app --host 0.0.0.0 --port $PORT`に設定

### 1.3 環境変数設定
- [ ] 「Variables」タブを開く
- [ ] 以下を追加:
  - [ ] `GEMINI_API_KEY` = （あなたのGemini APIキー）
  - [ ] `OPENAI_API_KEY` = （あなたのOpenAI APIキー）
  - [ ] `PORT` = `8000`
  - [ ] `DEBUG` = `False`

### 1.4 デプロイURL取得
- [ ] 「Settings」→「Networking」→「Public Networking」
- [ ] 生成されたURLをコピー（例: `https://tts-backend-production-xxxx.up.railway.app`）
- [ ] URLをメモ帳に保存（後で使用）

### 1.5 動作確認
- [ ] Railway URLにアクセス
- [ ] `https://your-backend.up.railway.app/docs`でAPI docsが表示されることを確認

## ステップ2: フロントエンドデプロイ（Vercel）

### 2.1 プロジェクトインポート
- [ ] Vercelにログイン
- [ ] 「Add New...」→「Project」を選択
- [ ] TTSリポジトリをインポート

### 2.2 設定
- [ ] **Framework Preset**: Vite
- [ ] **Root Directory**: `frontend`
- [ ] **Build Command**: `npm run build`
- [ ] **Output Directory**: `dist`

### 2.3 環境変数設定
- [ ] 「Environment Variables」セクションを開く
- [ ] 以下を追加:
  - [ ] `VITE_API_BASE_URL` = （ステップ1.4で取得したRailway URL）
  - [ ] `VITE_DEBUG` = `false`

### 2.4 デプロイ実行
- [ ] 「Deploy」ボタンをクリック
- [ ] デプロイ完了を待つ（2〜3分）

### 2.5 デプロイURL取得
- [ ] 生成されたURLをコピー（例: `https://tts-app.vercel.app`）
- [ ] URLをメモ帳に保存

## ステップ3: CORS設定更新

### 3.1 Vercel URLをバックエンドに追加
- [ ] ローカルで`backend/app/core/config.py`を編集
- [ ] `cors_origins`リストにVercel URLを追加:
  ```python
  cors_origins: Union[List[str], str] = [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "https://tts-app.vercel.app",  # ← あなたのVercel URL
  ]
  ```

### 3.2 GitHubにpush
- [ ] 変更をコミット:
  ```bash
  git add backend/app/core/config.py
  git commit -m "Add production Vercel URL to CORS origins"
  git push origin master
  ```
- [ ] Railwayが自動的に再デプロイすることを確認

## ステップ4: 動作確認

### 4.1 基本動作確認
- [ ] Vercel URLにアクセス
- [ ] ページが正常に表示される
- [ ] ブラウザのコンソールにエラーがない

### 4.2 機能テスト
- [ ] 画像をアップロード
- [ ] OCRが成功してテキストが表示される
- [ ] 「Generate Audio」をクリック
- [ ] 音声が生成される
- [ ] 再生ボタンをクリック
- [ ] 音声が再生される
- [ ] 速度調整が動作する
- [ ] ポーズ機能が動作する

### 4.3 エラーチェック
- [ ] ブラウザのコンソールにエラーがない
- [ ] ネットワークタブで全てのAPIリクエストが成功している（200 OK）

## ステップ5: 生徒向けドキュメント作成

- [ ] `docs/USER_GUIDE.md`を作成
- [ ] 使い方を簡潔に説明
- [ ] スクリーンショットを追加（必要に応じて）

## ステップ6: 生徒への共有

### 6.1 共有情報の準備
- [ ] アプリURL: `https://your-app-name.vercel.app`
- [ ] 使い方ガイド: `docs/USER_GUIDE.md`
- [ ] サポート連絡先: あなたのメールアドレス

### 6.2 共有
- [ ] 生徒にメールまたはメッセージで共有
- [ ] 使い方を簡単に説明

## トラブルシューティング

### CORS Errorが出る場合
1. Railwayの環境変数を確認
2. `backend/app/core/config.py`のcors_originsを確認
3. GitHubにpush済みか確認
4. Railwayが再デプロイされたか確認

### 500 Errorが出る場合
1. RailwayのLogsを確認（「Deployments」→「View Logs」）
2. 環境変数（GEMINI_API_KEY、OPENAI_API_KEY）が正しく設定されているか確認
3. 手動で再デプロイ

### フロントエンドが表示されない場合
1. VercelのLogsを確認
2. ビルドが成功しているか確認
3. Root Directoryが`frontend`になっているか確認

## 完了！

全てのチェックが完了したら、デプロイ成功です🎉

次のステップ:
- 生徒に使ってもらう
- フィードバックを収集
- 必要に応じて改善

## メモ欄

デプロイ中に気づいたことや変更点をメモしてください:

```
Railway URL:
Vercel URL:
デプロイ日時:
その他メモ:
```
