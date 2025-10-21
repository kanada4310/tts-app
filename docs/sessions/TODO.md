# TODO

最終更新: 2025-10-21

## 🔴 最優先（次のセッション開始時）

### デプロイ関連（生徒に使ってもらうため）

- [ ] **Railwayへのバックエンドデプロイ**
  - [ ] Railwayアカウント作成
  - [ ] プロジェクト作成とGitHub連携
  - [ ] 環境変数設定（GEMINI_API_KEY, OPENAI_API_KEY）
  - [ ] デプロイ実行とURL確認
  - **ガイド**: `docs/DEPLOYMENT.md`、`docs/DEPLOYMENT_CHECKLIST.md`
  - 所要時間: 30分

- [ ] **Vercelへのフロントエンドデプロイ**
  - [ ] Vercelアカウント作成
  - [ ] プロジェクトインポートとGitHub連携
  - [ ] 環境変数設定（VITE_API_BASE_URL）
  - [ ] デプロイ実行とURL確認
  - **ガイド**: `docs/DEPLOYMENT.md`、`docs/DEPLOYMENT_CHECKLIST.md`
  - 所要時間: 30分

- [ ] **CORS設定更新とデプロイ後の動作確認**
  - [ ] Vercel URLをバックエンドのCORS設定に追加
  - [ ] 変更をGitHubにpush（自動再デプロイ）
  - [ ] E2Eテスト（画像アップロード→OCR→TTS→再生）
  - 所要時間: 20分

- [ ] **生徒向け使用ガイド作成**
  - [ ] `docs/USER_GUIDE.md`作成
  - [ ] アプリURLと基本的な使い方を説明
  - [ ] トラブルシューティングセクション追加
  - 所要時間: 30分

## 🟡 高優先度

- [x] バックエンドの基本セットアップ ✅
- [x] バックエンドAPI実装 ✅
- [x] バックエンドのテスト実装 ✅
- [x] Gemini OCR統合 ✅
- [x] OpenAI TTS統合 ✅
- [x] エンドツーエンド統合テスト ✅

### 新機能実装

- [x] 複数画像アップロード機能実装 ✅
  - [x] バックエンド: OCRエンドポイント拡張（複数画像対応）
  - [x] バックエンド: 画像結合ロジック実装
  - [x] フロントエンド: 複数ファイル選択UI
  - [x] フロントエンド: アップロード進捗表示

- [x] AudioPlayer拡張機能実装 ✅
  - [x] テキスト解析: 文の境界検出ロジック実装
  - [x] 文ごとのポーズ挿入機能（0-5秒、0.5秒刻み）
  - [x] 文ごとのナビゲーション（前/次スキップボタン）
  - [x] シークバー上の文境界マーカー表示
  - [x] シークバーツールチップ（文の先頭5-10単語表示）
  - [x] ポーズ設定UI（有効/無効切り替え、秒数スライダー）

- [x] 正確なタイムスタンプ機能実装 ✅
  - [x] バックエンド: 文ごとのTTS生成（generate_speech_with_timings）
  - [x] バックエンド: pydubによる正確な音声長測定
  - [x] バックエンド: /api/tts-with-timings エンドポイント追加
  - [x] フロントエンド: performTTSWithTimings API関数
  - [x] フロントエンド: AudioPlayerの3段階タイムスタンプ精度システム

- [x] タイムスタンプ精度の改善（セッション#8） ✅
  - [x] ffmpegの自動検知機能実装
  - [x] opus → mp3フォーマット変更（ffmpeg互換性対応）
  - [x] 連結後の実際の長さで比例補正
  - [x] 文間に200msの無音挿入
  - [x] ポーズロジックの改善（シーク機能追加）
  - [ ] **ポーズ前の音被り問題（未完全解決）**

## 🟢 中優先度（生徒フィードバック後に実施）

### 機能改善

- [ ] **ポーズ前の音被り問題の完全解決**
  - **現状**: 200msの無音を挿入したが、まだポーズ前に次の文の一瞬の音が聞こえる
  - **対策1**: ポーズ検知タイミングを0.1秒 → 0.25秒または0.3秒前に早める
  - **対策2**: 無音期間を200ms → 300msまたは400msに延長
  - **対策3**: ポーズロジックの最適化（シーク操作を即座に実行、状態管理改善）
  - **対策4**: 代替アプローチ（Web Audio API使用）の検討
  - **ファイル**: `frontend/src/components/features/AudioPlayer/AudioPlayer.tsx`
  - 所要時間: 1-2時間

- [ ] Error loading audioエラーの調査
  - **現状**: 詳細なエラーログを追加したが、まだ原因不明
  - **次回**: エラーログの詳細（code, message, networkState, readyState）を確認
  - **ファイル**: `frontend/src/components/features/AudioPlayer/AudioPlayer.tsx`
  - 所要時間: 30分

- [ ] パフォーマンステストとUI改善
  - [ ] 5文、10文、20文での生成時間測定
  - [ ] TTS生成の進捗表示UI追加
  - [ ] ローディング状態の改善
  - [ ] タイムアウト処理の確認
  - 所要時間: 1時間

- [ ] OCR精度の評価とチューニング
  - [ ] 様々な画像タイプでOCR精度を確認
  - [ ] 手書き除外機能のテスト
  - [ ] 多言語対応の確認
  - [ ] プロンプトの最適化（必要に応じて）
  - 所要時間: 30分

### パフォーマンス最適化

- [x] フロントエンド基本機能実装 ✅
- [x] サービス層実装 ✅
- [x] 音程保持機能実装（HTML5 Audio API） ✅

- [ ] IndexedDBキャッシュ実装（オプション）
  - [ ] 画像キャッシュ機能
  - [ ] 音声キャッシュ機能
  - [ ] キャッシュ管理UI
  - 所要時間: 2時間

- [ ] TTS生成の最適化
  - [ ] キャッシュ機構（同じテキストの再生成を避ける）
  - [ ] 長文（30文以上）のパフォーマンス改善
  - 所要時間: 1.5時間

## 🔵 低優先度

- [ ] PWA対応
  - [ ] Service Worker実装
  - [ ] manifest.json設定
  - [ ] オフライン対応
  - 所要時間: 2時間

- [ ] フロントエンドテスト実装
  - [ ] ユニットテスト
  - [ ] E2Eテスト
  - 所要時間: 2時間

- [ ] デプロイ設定
  - [ ] Vercel設定
  - [ ] Railway設定
  - [ ] CI/CD設定
  - 所要時間: 1時間

## 📝 備考

**次回セッションで参照すべきファイル:**
- `backend/app/services/openai_service.py` - TTS生成ロジック、pydub使用
- `backend/app/api/routes/tts.py` - /api/tts-with-timings エンドポイント
- `frontend/src/components/features/AudioPlayer/AudioPlayer.tsx` - タイムスタンプ使用ロジック

**次回セッション前の準備:**
- [ ] ffmpegがインストールされているか確認（`ffmpeg -version`）
  - Windowsの場合: https://ffmpeg.org/download.html からダウンロードしてPATHに追加
  - macOS: `brew install ffmpeg`
  - Linux: `sudo apt-get install ffmpeg`
- [ ] ブラウザのデベロッパーツールを開いてコンソールエラーを確認できる状態にする

**技術メモ:**
- pydubはffmpegに依存（音声ファイルの長さ測定に必要）
- 文ごとのTTS生成により、API使用量が増加（文数 × API呼び出し）
- タイムスタンプ精度: 95-99%（推定: 70-85%）
