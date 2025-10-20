# TODO

最終更新: 2025-10-20

## 🔴 最優先（次のセッション開始時）

- [ ] フロントエンドの基本セットアップ
  - [ ] Vite + React + TypeScript プロジェクト初期化
  - [ ] ディレクトリ構造作成（PROJECT_STRUCTURE.mdに準拠）
  - [ ] 基本設定ファイル作成（tsconfig.json, vite.config.ts）
  - [ ] .env.example作成
  - 所要時間: 30分

## 🟡 高優先度

- [x] バックエンドの基本セットアップ ✅
  - [x] ディレクトリ構造作成
  - [x] requirements.txt作成
  - [x] FastAPIの基本設定（main.py, config.py）
  - [x] 環境変数設定（.env.example）

- [x] バックエンドAPI実装 ✅
  - [x] OCRエンドポイント（/api/ocr）
  - [x] TTSエンドポイント（/api/tts）
  - [x] Pydanticスキーマ（schemas/）
  - [x] Claude/OpenAIサービス（services/）
  - [x] エラーハンドリング
  - [x] レート制限実装

- [x] バックエンドのテスト実装 ✅
  - [x] OCRエンドポイントのテスト（10テスト）
  - [x] TTSエンドポイントのテスト（17テスト）
  - [x] サービス層のテスト（20テスト）
  - [x] エラーハンドリングのテスト

## 🟢 中優先度

- [ ] フロントエンド機能実装
  - [ ] ImageUploadコンポーネント
  - [ ] TextEditorコンポーネント
  - [ ] AudioPlayerコンポーネント
  - [ ] SpeedControlコンポーネント
  - 所要時間: 4時間

- [ ] サービス層実装
  - [ ] 画像圧縮サービス
  - [ ] API通信サービス
  - [ ] IndexedDBキャッシュ
  - [ ] Tone.js音声再生
  - 所要時間: 3時間

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

- 開発はバックエンド→フロントエンドの順で進める
- 各機能実装後にHANDOVER.mdとSUMMARY.mdを更新
- 問題が発生したら詳細をHANDOVER.mdに記録
