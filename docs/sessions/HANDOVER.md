# 開発ハンドオーバー記録

> このファイルには最新のセッション情報のみを記載します。
> 過去のセッション履歴は [SESSION_HISTORY.md](SESSION_HISTORY.md) を参照してください。

---

## セッション #10 - 2025-10-21

### 実施内容

#### 1. Railway（バックエンド）へのデプロイ

**背景**:
セッション#9でデプロイ設計とドキュメントを作成。セッション#10では実際のデプロイを実施し、複数のエラーに遭遇しながら解決した。

**発生したエラーと解決策**:

##### エラー1: ffmpegが見つからない
- **ログ**: `[WARNING] ffmpeg not found in common locations`
- **原因**: openai_service.pyがWindows専用パス（`C:\ProgramData\chocolatey\...`）のみを参照
- **解決**:
  1. `backend/aptfile`を作成してffmpegをインストール（Railway用）
  2. `openai_service.py`のffmpeg検知ロジックをクロスプラットフォーム対応に修正
     - まず`shutil.which("ffmpeg")`でPATH内を検索（Linux対応）
     - 見つからない場合のみWindows専用パスを確認
     - `platform.system()`で環境を自動判定

##### エラー2: nixpacks.tomlでpipコマンドが見つからない
- **エラー**: `pip: command not found`
- **原因**: nixpacks.tomlの設定が不完全
- **解決**: nixpacks.tomlを削除し、aptfileのみ使用（Railwayのデフォルト設定を活用）

##### エラー3: ModuleNotFoundError: No module named 'google'
- **原因**: requirements.txtに`google-generativeai`（Gemini APIクライアント）が欠けていた
- **解決**: requirements.txtに`google-generativeai==0.8.3`を追加

**最終的な構成**:
- `backend/aptfile`: ffmpegのインストール（Ubuntu/Debianパッケージ）
- `backend/Procfile`: 起動コマンド（既存）
- `backend/requirements.txt`: Python依存関係（google-generativeai追加）

**Railway URL**: `https://tts-app-production.up.railway.app`

#### 2. Vercel（フロントエンド）へのデプロイ

**設定**:
- Framework Preset: Vite
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- 環境変数: `VITE_API_BASE_URL=https://tts-app-production.up.railway.app`

**発生したエラーと解決策**:

##### エラー1: vercel.jsonの非推奨設定
- **問題**: 古いVercel v2形式（`builds`, `routes`）を使用
- **解決**: vercel.jsonを簡略化（`rewrites`のみ保持、SPA用）

##### エラー2: TypeScript build error
- **エラー**:
  - `Line 82: 'index' is declared but its value is never read`
  - `Line 181: 'currentSentence' is declared but its value is never read`
- **解決**: 未使用変数を削除
  - `map((sentenceText, index) =>` → `map((sentenceText) =>`
  - `const currentSentence` を削除

**Vercel URL**: `https://tts-app-ycaz.vercel.app`

#### 3. CORS設定の更新

**手順**:
1. `backend/app/core/config.py`のcors_originsにVercel URLを追加
2. GitHubにpush → Railwayが自動再デプロイ
3. Railway環境変数の`CORS_ORIGINS`を削除（コード内の設定を使用）

**最終的なCORS設定**:
```python
cors_origins: Union[List[str], str] = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "https://tts-app-ycaz.vercel.app",  # 本番環境
]
```

### 技術的決定事項

#### aptfileの採用（nixpacks.toml削除）
- **決定**: aptfileでffmpegをインストール、nixpacks.tomlは不使用
- **理由**:
  - Railwayのデフォルト設定（Python自動検出）を活用
  - nixpacks.tomlでpip設定が複雑化
  - aptfileはシンプルで保守しやすい
- **ファイル内容**: `ffmpeg`（1行のみ）

#### クロスプラットフォームffmpeg検知
- **決定**: `shutil.which()`を最初に使用
- **理由**:
  - Linux/Docker/Railwayでは通常PATHに含まれる
  - Windowsローカル環境でも後方互換性維持
  - `platform.system()`で環境を判定
- **フォールバック**: Windows環境のみChocolateyパスを確認

#### vercel.jsonの簡略化
- **決定**: SPA用の`rewrites`のみ保持
- **理由**:
  - `builds`と`routes`はVercel v2の非推奨機能
  - ビルド設定はVercelダッシュボードで手動指定
  - シンプルな設定でメンテナンス性向上

#### 環境変数 vs コード設定
- **決定**: CORS設定はコード内に記載、環境変数は使用しない
- **理由**:
  - 環境変数がコードを上書きして混乱を招く
  - GitHubでバージョン管理できる
  - デプロイ時の設定ミスを防ぐ

### 発生した問題と解決

#### 問題1: ffmpegパスがLinux環境で無効
- **原因**: `C:\ProgramData\...`のようなWindowsパスを参照
- **解決**: `shutil.which()`を最優先、環境判定を追加
- **所要時間**: 30分

#### 問題2: pipコマンドが見つからない（nixpacks）
- **原因**: nixpacks.tomlの設定不備
- **解決**: nixpacks.tomlを削除、aptfileに切り替え
- **所要時間**: 15分

#### 問題3: google-generativeaiモジュール欠落
- **原因**: requirements.txtに記載漏れ
- **解決**: `google-generativeai==0.8.3`を追加
- **所要時間**: 5分

#### 問題4: TypeScript未使用変数エラー
- **原因**: リファクタリング時の削除漏れ
- **解決**: 未使用変数を削除
- **所要時間**: 10分

#### 問題5: CORSエラー（継続中）
- **現状**: Railwayデプロイ完了後もCORSエラーが発生
- **試した対策**:
  - ✅ CORS_ORIGINS環境変数を削除
  - ✅ config.pyにVercel URLを追加
  - ✅ GitHubにpushして再デプロイ
- **未解決**: 再デプロイの完了待ち、またはログ確認が必要

### 次セッションへの引き継ぎ事項

#### 🔴 最重要: CORSエラーの最終解決

**現状**:
- Railwayデプロイは成功（Status: Success）
- CORS_ORIGINS環境変数は削除済み
- config.pyにVercel URL追加済み
- しかしCORSエラーが継続

**次回の確認ポイント**:
1. **Railwayの再デプロイ確認**
   - 最新のデプロイ時刻を確認（`CORS_ORIGINS`削除後か？）
   - 環境変数タブで`CORS_ORIGINS`が完全に削除されているか再確認
   - 必要に応じて手動で再デプロイ

2. **Railwayログの確認**
   - 「View Logs」で起動ログを確認
   - `Application startup complete`が表示されているか
   - CORS設定が正しくロードされているか（ログに`localhost`や`vercel.app`が含まれるか）

3. **ブラウザでの再テスト**
   - キャッシュクリア（Ctrl+Shift+R）
   - デベロッパーツールでNetwork タブを確認
   - Preflightリクエスト（OPTIONS）のレスポンスヘッダーを確認

4. **最終手段: 環境変数で明示的に設定**
   - もしコード設定が反映されない場合
   - Railway環境変数に`CORS_ORIGINS`を再追加
   - 値: `http://localhost:5173,https://tts-app-ycaz.vercel.app`

#### 🟡 E2E動作確認

CORSエラー解決後、以下をテスト:
1. 画像アップロード → OCR
2. TTS音声生成
3. 音声再生、速度調整、ポーズ機能
4. ブラウザコンソールでエラーがないことを確認

#### 🟢 生徒向け使用ガイド作成

E2Eテスト完了後:
- `docs/USER_GUIDE.md`を作成
- アプリURL、基本的な使い方、トラブルシューティングを記載

#### 注意事項
- PWA警告（pwa-192x192.png）は無視して問題なし
- ffmpegはRailwayで自動インストール済み
- 本番URLはGitHubでバージョン管理（環境変数ではなく）

### 成果物リスト

#### 新規作成ファイル
- [x] `backend/aptfile` - ffmpegインストール設定
- [x] `backend/nixpacks.toml` - 作成後に削除（aptfileに切り替え）

#### 更新ファイル
- [x] `backend/app/services/openai_service.py` - クロスプラットフォームffmpeg検知
- [x] `backend/requirements.txt` - google-generativeai追加
- [x] `backend/app/core/config.py` - Vercel URL追加
- [x] `frontend/src/components/features/AudioPlayer/AudioPlayer.tsx` - 未使用変数削除
- [x] `vercel.json` - 簡略化（SPA用rewritesのみ）

#### コミット履歴
1. `Fix Railway deployment: ffmpeg cross-platform support`
2. `Fix Railway build: Use aptfile instead of nixpacks`
3. `Add missing google-generativeai dependency`
4. `Fix TypeScript errors: Remove unused variables`
5. `Add Vercel production URL to CORS origins`

### デプロイ結果

#### Railway（バックエンド）
- ✅ ビルド成功
- ✅ デプロイ成功
- ✅ URL: `https://tts-app-production.up.railway.app`
- ⏳ CORS設定反映待ち

#### Vercel（フロントエンド）
- ✅ ビルド成功
- ✅ デプロイ成功
- ✅ URL: `https://tts-app-ycaz.vercel.app`
- ✅ ページ表示確認済み

#### 統合テスト
- ⏳ CORSエラーにより未完了
- 次セッションで解決予定

---

## 📚 過去のセッション

過去のセッション詳細は [SESSION_HISTORY.md](SESSION_HISTORY.md) を参照してください。

**セッション一覧:**
- [セッション #9 (2025-10-21)](SESSION_HISTORY.md#セッション-9---2025-10-21): デプロイ設計とドキュメント作成
- [セッション #8 (2025-10-21)](SESSION_HISTORY.md#セッション-8---2025-10-21): タイムスタンプ精度改善とポーズ機能デバッグ
- [セッション #7 (2025-10-21)](SESSION_HISTORY.md#セッション-7---2025-10-21): 文ごとのTTS生成による正確なタイムスタンプ実装
- [セッション #6 (2025-10-20)](SESSION_HISTORY.md#セッション-6---2025-10-20): 複数画像アップロード機能実装
- [セッション #5 (2025-10-20)](SESSION_HISTORY.md#セッション-5---2025-10-20): 統合テスト完了と音程保持機能実装
- [セッション #4 (2025-10-20)](SESSION_HISTORY.md#セッション-4---2025-10-20): Gemini API統合、ローカル環境セットアップ
- [セッション #3 (2025-10-20)](SESSION_HISTORY.md#セッション-3---2025-10-20): バックエンドテスト実装完了
- [セッション #2 (2025-10-20)](SESSION_HISTORY.md#セッション-2---2025-10-20): バックエンドAPI実装完了
- [セッション #1 (2025-10-20)](SESSION_HISTORY.md#セッション-1---2025-10-20): プロジェクト初期化、GitHub連携
