# TTS App - OCR & Text-to-Speech Application

## 概要

画像から文字を抽出(OCR)し、音声に変換して速度調整しながら再生できるPWAアプリケーションです。学習や読書のサポートツールとして、画像ベースの文書を音声で聴くことができます。

- **対象ユーザー**: 学習者、読書家、視覚サポートが必要な方
- **解決する課題**: 画像ベースの文書を音声で効率的に学習・確認できる

## 主要機能

- 📷 **画像OCR**: Claude APIによる高精度なテキスト抽出
- 🔊 **TTS音声生成**: OpenAI TTS APIによる自然な音声合成
- ⚡ **速度調整再生**: 0.5〜1.25倍速で音程を維持しながら再生
- 🔁 **リピート機能**: 1文ごとの繰り返し再生
- ⏸️ **ポーズ機能**: 1〜5秒の間隔設定
- 💾 **オフライン対応**: IndexedDBキャッシュとPWA対応

## 技術スタック

### フロントエンド
- React 18 + TypeScript
- Vite (ビルドツール)
- Tone.js (音声処理)
- PWA (Service Worker + Manifest)

### バックエンド
- Python 3.11
- FastAPI
- Claude API (OCR)
- OpenAI TTS API

### インフラ
- Vercel (Frontend)
- Railway (Backend)

## プロジェクト構成

```
TTS/
├── frontend/              # React + TypeScript
│   ├── src/
│   │   ├── components/    # UIコンポーネント
│   │   ├── hooks/         # カスタムフック
│   │   ├── services/      # サービス層
│   │   ├── types/         # 型定義
│   │   ├── constants/     # 定数
│   │   └── utils/         # ユーティリティ
│   └── package.json
├── backend/               # FastAPI
│   ├── app/
│   │   ├── api/routes/    # エンドポイント
│   │   ├── core/          # 設定・定数
│   │   ├── services/      # API連携
│   │   ├── schemas/       # Pydanticモデル
│   │   └── utils/         # ユーティリティ
│   └── requirements.txt
├── docs/                  # ドキュメント
│   ├── sessions/          # セッション管理
│   │   ├── TODO.md        # 次のタスク
│   │   ├── SUMMARY.md     # 進捗サマリー
│   │   └── HANDOVER.md    # 作業履歴
│   ├── SPECIFICATION.md   # 機能仕様
│   ├── API.md             # API仕様
│   └── ARCHITECTURE.md    # アーキテクチャ
├── .claude/
│   └── commands/
│       └── start.md       # /startコマンド
└── PROJECT_STRUCTURE.md   # 構造設計
```

## 開発環境セットアップ

### バックエンド

```bash
cd backend

# 仮想環境作成
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 依存関係インストール
pip install -r requirements.txt

# 環境変数設定
cp .env.example .env
# .envファイルを編集してAPIキーを設定

# 開発サーバー起動
python -m app.main
```

### フロントエンド

```bash
cd frontend

# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env

# 開発サーバー起動
npm run dev
```

## 環境変数

### バックエンド (.env)
```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### フロントエンド (.env)
```
VITE_API_BASE_URL=http://localhost:8000
```

## セッション管理

次のセッション開始時は `/start` コマンドを実行してください。
プロジェクトの状態を自動で把握し、TODO.mdの最優先タスクから作業を開始します。

## ドキュメント

- [機能仕様書](docs/SPECIFICATION.md)
- [API仕様書](docs/API.md)
- [アーキテクチャ](docs/ARCHITECTURE.md)
- [プロジェクト構造](PROJECT_STRUCTURE.md)
- [開発進捗](docs/sessions/SUMMARY.md)
