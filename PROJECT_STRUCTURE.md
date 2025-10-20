# プロジェクト構造設計

## 最適化されたディレクトリ構造

```
TTS/
├── docs/                           # ドキュメント
│   ├── sessions/                   # セッション管理
│   │   ├── HANDOVER.md            # 詳細な作業履歴
│   │   ├── SUMMARY.md             # 要約
│   │   └── TODO.md                # 次のタスク
│   ├── README.md                   # プロジェクト概要
│   ├── SPECIFICATION.md            # 機能仕様
│   ├── API.md                      # API仕様
│   └── ARCHITECTURE.md             # アーキテクチャ
│
├── backend/                        # Python/FastAPI
│   ├── app/
│   │   ├── api/                   # APIエンドポイント
│   │   │   ├── __init__.py
│   │   │   ├── routes/            # ルート定義
│   │   │   │   ├── __init__.py
│   │   │   │   ├── ocr.py         # OCRエンドポイント
│   │   │   │   └── tts.py         # TTSエンドポイント
│   │   │   └── deps.py            # 依存関係
│   │   │
│   │   ├── core/                  # コア設定
│   │   │   ├── __init__.py
│   │   │   ├── config.py          # 環境変数・設定
│   │   │   ├── constants.py       # 定数
│   │   │   └── errors.py          # カスタムエラー
│   │   │
│   │   ├── services/              # ビジネスロジック
│   │   │   ├── __init__.py
│   │   │   ├── claude_service.py  # Claude API連携
│   │   │   └── openai_service.py  # OpenAI API連携
│   │   │
│   │   ├── schemas/               # Pydanticモデル
│   │   │   ├── __init__.py
│   │   │   ├── ocr.py             # OCRリクエスト/レスポンス
│   │   │   └── tts.py             # TTSリクエスト/レスポンス
│   │   │
│   │   ├── utils/                 # ユーティリティ
│   │   │   ├── __init__.py
│   │   │   ├── image_processing.py # 画像処理
│   │   │   ├── rate_limiter.py    # レート制限
│   │   │   └── validators.py      # バリデーション
│   │   │
│   │   └── main.py                # FastAPIアプリ起動
│   │
│   ├── tests/                     # テスト
│   │   ├── __init__.py
│   │   ├── test_ocr.py
│   │   └── test_tts.py
│   │
│   ├── requirements.txt           # Python依存関係
│   ├── requirements-dev.txt       # 開発用依存関係
│   ├── .env.example               # 環境変数テンプレート
│   └── README.md                  # バックエンドREADME
│
├── frontend/                       # React/TypeScript
│   ├── src/
│   │   ├── components/            # UIコンポーネント
│   │   │   ├── features/          # 機能別コンポーネント
│   │   │   │   ├── ImageUpload/
│   │   │   │   │   ├── index.tsx
│   │   │   │   │   ├── ImageUpload.tsx
│   │   │   │   │   ├── ImagePreview.tsx
│   │   │   │   │   └── styles.module.css
│   │   │   │   ├── TextEditor/
│   │   │   │   │   ├── index.tsx
│   │   │   │   │   ├── TextEditor.tsx
│   │   │   │   │   ├── EditorToolbar.tsx
│   │   │   │   │   └── styles.module.css
│   │   │   │   ├── AudioPlayer/
│   │   │   │   │   ├── index.tsx
│   │   │   │   │   ├── AudioPlayer.tsx
│   │   │   │   │   ├── PlaybackControls.tsx
│   │   │   │   │   ├── SpeedControl.tsx
│   │   │   │   │   └── styles.module.css
│   │   │   │   └── RepeatControl/
│   │   │   │       ├── index.tsx
│   │   │   │       ├── RepeatControl.tsx
│   │   │   │       └── styles.module.css
│   │   │   │
│   │   │   ├── common/            # 共通コンポーネント
│   │   │   │   ├── Button/
│   │   │   │   ├── LoadingSpinner/
│   │   │   │   ├── ErrorMessage/
│   │   │   │   └── ProgressBar/
│   │   │   │
│   │   │   └── layouts/           # レイアウト
│   │   │       ├── MainLayout.tsx
│   │   │       └── Header.tsx
│   │   │
│   │   ├── hooks/                 # カスタムフック
│   │   │   ├── api/               # API関連
│   │   │   │   ├── useOCR.ts
│   │   │   │   └── useTTS.ts
│   │   │   ├── audio/             # 音声関連
│   │   │   │   ├── useAudioPlayer.ts
│   │   │   │   └── useSpeedControl.ts
│   │   │   └── storage/           # ストレージ関連
│   │   │       ├── useCache.ts
│   │   │       └── useIndexedDB.ts
│   │   │
│   │   ├── services/              # サービス層
│   │   │   ├── api/
│   │   │   │   ├── client.ts      # APIクライアント設定
│   │   │   │   ├── ocr.ts         # OCR API呼び出し
│   │   │   │   └── tts.ts         # TTS API呼び出し
│   │   │   ├── audio/
│   │   │   │   ├── tonePlayer.ts  # Tone.js音声再生
│   │   │   │   └── audioProcessor.ts
│   │   │   ├── image/
│   │   │   │   └── compression.ts # 画像圧縮
│   │   │   └── storage/
│   │   │       ├── cache.ts       # キャッシュ管理
│   │   │       └── indexedDB.ts   # IndexedDB操作
│   │   │
│   │   ├── types/                 # 型定義
│   │   │   ├── api.ts             # API型
│   │   │   ├── audio.ts           # 音声型
│   │   │   └── common.ts          # 共通型
│   │   │
│   │   ├── constants/             # 定数
│   │   │   ├── api.ts             # APIエンドポイント等
│   │   │   ├── audio.ts           # 音声設定
│   │   │   └── storage.ts         # ストレージ設定
│   │   │
│   │   ├── utils/                 # ユーティリティ
│   │   │   ├── validators.ts      # バリデーション
│   │   │   ├── formatters.ts      # フォーマット
│   │   │   └── helpers.ts         # ヘルパー関数
│   │   │
│   │   ├── contexts/              # React Context
│   │   │   ├── AppContext.tsx     # アプリ全体の状態
│   │   │   └── AudioContext.tsx   # 音声状態
│   │   │
│   │   ├── App.tsx                # メインアプリ
│   │   ├── main.tsx               # エントリーポイント
│   │   └── vite-env.d.ts
│   │
│   ├── public/                    # 静的ファイル
│   │   ├── manifest.json          # PWA manifest
│   │   ├── sw.js                  # Service Worker
│   │   └── icons/
│   │
│   ├── tests/                     # テスト
│   │   ├── unit/
│   │   └── integration/
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── .env.example
│   └── README.md
│
├── .claude/                        # Claude Code設定
│   └── commands/
│       └── start.md               # /startコマンド
│
├── .gitignore
├── .env.example                    # ルート環境変数
└── README.md                       # プロジェクトREADME（シンボリックリンク）
```

## ファイルサイズガイドライン

### 小（50-100行）
- 定数ファイル（constants/）
- 型定義（types/）
- シンプルなユーティリティ

### 中（100-200行）
- 個別のコンポーネント
- カスタムフック
- APIサービス

### 大（200-300行）
- 複雑なコンポーネント（分割推奨）
- メインのサービスクラス

### 300行超過 → 分割必須
- 機能ごとに分割
- サブコンポーネントに抽出

## 重複防止戦略

### 1. 定数の一元管理
```typescript
// frontend/src/constants/audio.ts
export const AUDIO_CONFIG = {
  SPEED_MIN: 0.5,
  SPEED_MAX: 1.25,
  SPEED_DEFAULT: 1.0,
  PAUSE_OPTIONS: [1, 2, 3, 4, 5]
} as const;
```

### 2. 型定義の共有
```typescript
// frontend/src/types/api.ts
export interface OCRRequest {
  image: string;
  options: OCROptions;
}
```

### 3. ユーティリティの集約
```typescript
// frontend/src/utils/validators.ts
export const isValidImageSize = (size: number) => size <= 10 * 1024 * 1024;
export const isValidImageType = (type: string) => ['image/jpeg', 'image/png'].includes(type);
```

### 4. サービス層の分離
- APIロジック: services/api/
- ビジネスロジック: services/（各ドメイン）
- 状態管理: contexts/

## セッション管理の仕組み

### HANDOVER.md
- 詳細な作業ログ
- 実装の意思決定理由
- 発生した問題と解決方法
- コードの変更履歴

### SUMMARY.md
- 現在の実装状況（%）
- 完了した機能リスト
- 未実装の機能リスト
- 既知の問題

### TODO.md
- 次のセッションでやるべきこと
- 優先順位付き
- 所要時間見積もり

## /startコマンドの動作

```markdown
# .claude/commands/start.md

以下のドキュメントを順番に読み込んでプロジェクトの状態を把握してください:

1. docs/sessions/TODO.md - 次のタスク
2. docs/sessions/SUMMARY.md - 現在の状況
3. docs/sessions/HANDOVER.md - 詳細な履歴（必要に応じて）
4. docs/SPECIFICATION.md - 機能仕様
5. docs/API.md - API仕様
6. docs/ARCHITECTURE.md - アーキテクチャ

読み込み完了後、TODO.mdの最優先タスクから作業を開始してください。
```
