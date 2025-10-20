# セッション履歴アーカイブ

このファイルには全セッションの詳細な作業履歴を保存します。

最新のセッション情報は [HANDOVER.md](HANDOVER.md) を参照してください。

## 目次
- [セッション #4 - 2025-10-20](#セッション-4---2025-10-20)
- [セッション #3 - 2025-10-20](#セッション-3---2025-10-20)
- [セッション #2 - 2025-10-20](#セッション-2---2025-10-20)
- [セッション #1 - 2025-10-20](#セッション-1---2025-10-20)

---

## セッション #4 - 2025-10-20

### 実施内容

#### 1. ローカル環境セットアップとトラブルシューティング

**フロントエンド環境構築**:
- `npm install`実行（477パッケージインストール完了）
- TypeScript型チェック実行とエラー修正（3箇所）
  - `App.tsx`: 未使用の`editedText`状態を削除
  - `AudioPlayer.tsx`: `speed`状態の型を明示的に`number`に指定
  - `compression.ts`: `file.type`の型アサーション追加

**バックエンド環境構築**:
- 依存関係確認済み（既にインストール済み）
- APIキー設定完了（Anthropic, OpenAI, Gemini）
- 設定ファイル修正:
  - `config.py`: CORS origins のパース処理追加（文字列→配列変換）
  - `config.py`: `anthropic_api_key`をオプショナルに変更
  - `config.py`: `gemini_api_key`を必須フィールドとして追加

**サーバー起動**:
- バックエンドサーバー: `http://0.0.0.0:8000` (起動成功)
- フロントエンドサーバー: `http://localhost:5173` (起動成功)

#### 2. OCR API統合の切り替え（Claude → Gemini）

**問題の発見と原因究明**:
1. Claude APIでOCR実行時に404エラー連発
2. 複数のモデル名を試行:
   - `claude-sonnet-4.5-20250929` → 404
   - `claude-sonnet-4-20241022` → 404
   - `claude-3-5-sonnet-20241022` → 404
   - `claude-3-5-sonnet-20240620` → 404
3. 根本原因判明: ユーザーのAnthropic APIキーがClaude 3モデルへのアクセス権を持っていない
   - `claude-3-haiku-20240307`のみ動作確認（テキストのみ）
   - OCR精度への懸念からGemini APIへ移行決定

**Gemini API統合実装**:
- パッケージインストール: `pip install google-generativeai`
- 新規ファイル作成: `backend/app/services/gemini_service.py`
  - `GeminiService`クラス実装
  - OCR用プロンプト生成ロジック
  - Base64画像処理とメディアタイプ検出
  - エラーハンドリング統合
- `backend/app/api/routes/ocr.py`更新:
  - `claude_service` → `gemini_service`へ切り替え
  - デバッグ用トレースバック追加
- `.env.example`更新: `GEMINI_API_KEY`追加

**モデル名の問題と解決**:
1. 初期実装: `gemini-1.5-flash` → 404エラー（v1beta APIに存在しない）
2. 修正試行: `gemini-pro-vision` → 404エラー（廃止済み）
3. 利用可能モデル調査実施（`genai.list_models()`）
4. 最終決定: `gemini-2.5-flash`（最新のFlashモデル）
   - generateContent対応
   - Vision機能搭載
   - 高速・高精度

### 技術的決定事項

#### OCRサービスの選択: Gemini API

**選択理由**:
1. AnthropicのAPIキー制約でClaude 3が利用不可
2. OCR精度: Gemini 2.5は最新のビジョンモデル
3. コスト効率: Flash版で十分な性能
4. API安定性: Google公式SDKのサポート

**実装方針**:
- プロンプトエンジニアリング:
  - `exclude_annotations`オプションで手書き除外指示
  - `language`パラメータで言語ヒント提供
  - 出力形式を明示（テキストのみ、説明なし）
- エラーハンドリング:
  - Google API例外を`OCRError`でラップ
  - 処理時間を記録（パフォーマンス監視用）

#### 開発環境の問題解決

**CORS設定**:
- Pydantic設定で文字列とリストの両方を受け入れ
- `@field_validator`でカンマ区切り文字列を自動パース
- `.env`ファイルでの設定を柔軟に

**APIキー管理**:
- `ANTHROPIC_API_KEY`: オプショナル（将来的な利用の余地）
- `OPENAI_API_KEY`: 必須（TTS用）
- `GEMINI_API_KEY`: 必須（OCR用）

### 発生した問題と解決

**問題1**: Claude API 404エラー連発
- **原因**: APIキーのアクセスレベルがClaude 3をサポートしていない
- **解決**: Gemini APIへ完全移行
- **所要時間**: 約45分（モデル名試行錯誤含む）

**問題2**: Gemini モデル名404エラー
- **原因1**: `gemini-1.5-flash`がv1beta APIに存在しない
- **原因2**: `gemini-pro-vision`が廃止済み
- **解決**: `genai.list_models()`で利用可能モデルを確認し、`gemini-2.5-flash`を採用
- **所要時間**: 約20分

**問題3**: サーバーの自動リロードが機能しない
- **原因**: 複数のUvicornプロセスが同時実行され、Pythonモジュールがキャッシュされた
- **解決**: 全てのバックグラウンドサーバーを終了し、新規プロセスで起動
- **所要時間**: 約10分

**問題4**: TypeScript型エラー
- **原因**: 厳格な型チェックによる不一致
- **解決**:
  - 未使用変数の削除
  - ジェネリック型の明示化
  - 型アサーションの追加
- **所要時間**: 約10分

**問題5**: CORS origins設定のバリデーションエラー
- **原因**: `.env`ファイルではカンマ区切り文字列だが、Pydanticがリストを期待
- **解決**: `@field_validator`で自動パース処理を追加
- **所要時間**: 約5分

### 成果物リスト

#### 新規作成ファイル
- [x] `backend/app/services/gemini_service.py` - Gemini OCRサービス実装（143行）

#### 更新ファイル
- [x] `backend/app/api/routes/ocr.py` - Gemini serviceへ切り替え + デバッグ追加
- [x] `backend/app/core/config.py` - Gemini API key追加、Anthropicをオプショナル化、CORSパーサー追加
- [x] `backend/app/core/constants.py` - Claudeモデル名を3.5 Sonnetに更新
- [x] `backend/.env.example` - Gemini API key の例追加
- [x] `frontend/src/App.tsx` - 未使用変数削除
- [x] `frontend/src/components/features/AudioPlayer/AudioPlayer.tsx` - 型明示化
- [x] `frontend/src/services/image/compression.ts` - 型アサーション追加
- [x] `frontend/src/constants/image.ts` - 定数名を実装に合わせて更新

---

## セッション #3 - 2025-10-20

（セッション#3の内容がすでに存在する場合はそのまま保持）

---

## セッション #2 - 2025-10-20

### 実施内容

#### 1. ドキュメント整理
- **目的**: プロジェクト構造に従ってファイルを適切な場所に配置
- **実施内容**:
  - SPECIFICATION.md, API.md, ARCHITECTURE.mdをdocs/ディレクトリに移動
  - ルートディレクトリにはREADME.md、PROJECT_STRUCTURE.md、GITHUB_SETUP.mdのみ残す
  - /start コマンドのパス設定は既に正しく設定済みを確認

#### 2. Pydanticスキーマ実装
- **ファイル**: `backend/app/schemas/ocr.py`, `backend/app/schemas/tts.py`
- **実装内容**:
  - OCRRequest, OCRResponse, OCROptions, OCRErrorResponse
  - TTSRequest, TTSErrorResponse
  - Field validationとdocstring完備
  - schemas/__init__.pyでエクスポート

**設計のポイント**:
- OCROptionsを別スキーマとして分離（再利用性向上）
- Base64画像データはstr型で受け取り
- TTSRequestにmin_length/max_lengthバリデーション追加

#### 3. Claude APIサービス実装
- **ファイル**: `backend/app/services/claude_service.py` (194行)
- **実装内容**:
  - Claude Vision APIを使用したOCR処理
  - Base64データのクリーニング（data URL prefix除去）
  - メディアタイプの自動判定
  - プロンプト生成ロジック（言語・注釈除外対応）
  - 信頼度判定（stop_reasonベース）

**技術的決定事項**:
- モデル: claude-sonnet-4.5-20250929（constants.pyから取得）
- max_tokens: 4096
- 画像形式: Base64エンコード、JPEG/PNG対応
- タイムアウト: 30秒（OCR_TIMEOUT）

**プロンプト戦略**:
```python
base_prompt = "Please extract all the text from this image."
if exclude_annotations:
    # 手書き注釈を除外
if language != "en":
    # 言語指定
# 説明なしでテキストのみ返すよう指示
```

#### 4. OpenAI TTSサービス実装
- **ファイル**: `backend/app/services/openai_service.py` (85行)
- **実装内容**:
  - OpenAI TTS API連携
  - Voice/Format バリデーション
  - ストリーミングレスポンスの処理（iter_bytes）
  - BytesIOでバイナリデータ構築

**技術的決定事項**:
- モデル: tts-1-hd
- 音声: nova（デフォルト）、6種類対応
- フォーマット: opus（デフォルト）、mp3/aac/flac対応
- 速度: 1.0倍速（生成時）
- タイムアウト: 30秒（TTS_TIMEOUT）

**エラーハンドリング**:
- Invalid voice/format → TTSGenerationError（400エラー）
- API失敗 → TTSGenerationError（500エラー）

#### 5. OCRエンドポイント実装
- **ファイル**: `backend/app/api/routes/ocr.py` (72行)
- **実装内容**:
  - POST /api/ocr エンドポイント
  - レート制限: 100回/時間（SlowAPI）
  - リクエスト/レスポンススキーマ適用
  - エラーハンドリング（OCRError → 500, その他 → 500）

**実装パターン**:
```python
@router.post("/ocr", response_model=OCRResponse)
@limiter.limit("100/hour")
async def extract_text_from_image(request: Request, ocr_request: OCRRequest):
    try:
        text, confidence, time = claude_service.extract_text(...)
        return OCRResponse(...)
    except OCRError as e:
        raise HTTPException(status_code=500, detail={...})
```

#### 6. TTSエンドポイント実装
- **ファイル**: `backend/app/api/routes/tts.py` (84行)
- **実装内容**:
  - POST /api/tts エンドポイント
  - レート制限: 100回/時間（SlowAPI）
  - バイナリレスポンス（Response）
  - メディアタイプマッピング（opus/mp3/aac/flac）

**実装パターン**:
```python
@router.post("/tts", response_class=Response)
@limiter.limit("100/hour")
async def generate_speech_from_text(...):
    audio_data = openai_service.generate_speech(...)
    media_type = media_type_map.get(format, "audio/opus")
    return Response(content=audio_data, media_type=media_type)
```

### 技術的決定事項の詳細

#### エラーハンドリング階層
1. **サービス層**:
   - OCRError, TTSGenerationError をraiseして詳細記録
   - error_code（constants.pyから）を含める
2. **エンドポイント層**:
   - サービス層のエラーをHTTPExceptionに変換
   - status_code（400/500）とdetail（error/message）を設定

#### ファイルサイズ管理
全ファイルが300行未満に収まっている:
- claude_service.py: 194行
- openai_service.py: 85行
- ocr.py: 72行
- tts.py: 84行

#### 定数の一元管理
全て`core/constants.py`から参照:
- CLAUDE_MODEL, CLAUDE_MAX_TOKENS
- OPENAI_TTS_MODEL, OPENAI_TTS_VOICE, OPENAI_TTS_SPEED, OPENAI_TTS_FORMAT
- ERROR_OCR_FAILED, ERROR_TTS_FAILED, ERROR_INTERNAL
- OCR_TIMEOUT, TTS_TIMEOUT

### 発生した問題と解決

**問題1**: TTSError vs TTSGenerationError
- 問題: openai_service.pyで誤ってTTSErrorを使用（基底クラス）
- 解決: TTSGenerationErrorに修正（具体的なエラークラス）

**問題2**: ドキュメントの配置
- 問題: API.md等がルートディレクトリに配置されていた
- 解決: docs/配下に移動し、プロジェクト構造に準拠

### 成果物リスト

#### 新規作成ファイル
- [x] backend/app/schemas/ocr.py - OCRスキーマ定義
- [x] backend/app/schemas/tts.py - TTSスキーマ定義
- [x] backend/app/services/claude_service.py - Claude API連携
- [x] backend/app/services/openai_service.py - OpenAI TTS連携

#### 更新ファイル
- [x] backend/app/schemas/__init__.py - スキーマエクスポート
- [x] backend/app/services/__init__.py - サービスエクスポート
- [x] backend/app/api/routes/ocr.py - OCRエンドポイント実装
- [x] backend/app/api/routes/tts.py - TTSエンドポイント実装
- [x] docs/sessions/TODO.md - タスク更新
- [x] docs/sessions/SUMMARY.md - 進捗更新（15% → 35%）
- [x] docs/sessions/HANDOVER.md - このファイル

#### 整理済み
- [x] docs/API.md - ルートから移動
- [x] docs/SPECIFICATION.md - ルートから移動
- [x] docs/ARCHITECTURE.md - ルートから移動

---

## セッション #1 - 2025-10-20

### 実施内容

#### 1. プロジェクトの初期把握
- 既存ドキュメント（README.md, SPECIFICATION.md, API.md, ARCHITECTURE.md）を確認
- プロジェクト概要を理解
  - 画像OCR + TTS音声再生アプリ
  - Claude API（OCR）+ OpenAI API（TTS）
  - React + FastAPI構成
  - PWA対応

#### 2. プロジェクト構造の最適化設計
- **目的**: セッションをまたいでも安定した開発を継続できる構造を設計
- **成果物**: PROJECT_STRUCTURE.md作成

**設計方針**:
1. **関心の分離**: 機能ごとにディレクトリ分割
2. **共通コードの集約**: constants/, utils/, types/で重複防止
3. **適切なファイルサイズ**: 1ファイル200-300行を目安
4. **セッション管理**: docs/sessions/配下で作業履歴管理

**バックエンド構造**:
```
backend/
├── app/
│   ├── api/routes/        # エンドポイント（ocr.py, tts.py）
│   ├── core/              # 設定・定数・エラー
│   ├── services/          # Claude/OpenAI連携
│   ├── schemas/           # Pydanticモデル
│   └── utils/             # 画像処理・レート制限
```

**フロントエンド構造**:
```
frontend/src/
├── components/
│   ├── features/          # ImageUpload, TextEditor, AudioPlayer等
│   ├── common/            # Button, LoadingSpinner等
│   └── layouts/           # MainLayout, Header
├── hooks/                 # useOCR, useTTS, useAudioPlayer等
├── services/              # API, audio, image, storage
├── types/                 # 型定義
├── constants/             # 定数
└── utils/                 # バリデーション、フォーマット等
```

#### 3. セッション管理システムの構築
- **目的**: 開発を中断・再開しても文脈を失わない仕組み

**成果物**:
- `docs/sessions/TODO.md`: 次のタスクリスト（優先度・所要時間付き）
- `docs/sessions/SUMMARY.md`: 実装状況の要約（進捗%、完了/未完了リスト）
- `docs/sessions/HANDOVER.md`: 詳細な作業ログ（このファイル）

**TODO.mdの優先度設定**:
- 🔴 最優先: バックエンド基本セットアップ
- 🟡 高優先度: API実装、フロントエンド基本セットアップ
- 🟢 中優先度: UI実装、サービス層実装
- 🔵 低優先度: PWA、テスト、デプロイ

#### 4. /startコマンドの実装準備
- `.claude/commands/start.md`を作成予定
- セッション開始時に自動で以下を読み込む仕組み:
  1. TODO.md（次のタスク）
  2. SUMMARY.md（現状把握）
  3. HANDOVER.md（詳細履歴）
  4. 各種仕様書

### 技術的決定事項

#### ディレクトリ構造の原則
1. **機能別分割**: 1つの機能 = 1つのディレクトリ
   - 例: `components/features/ImageUpload/`に関連ファイルをまとめる

2. **定数の一元管理**:
   ```typescript
   // constants/audio.ts
   export const AUDIO_CONFIG = {
     SPEED_MIN: 0.5,
     SPEED_MAX: 1.25,
     SPEED_DEFAULT: 1.0
   } as const;
   ```

3. **型定義の共有**:
   ```typescript
   // types/api.ts
   export interface OCRRequest {
     image: string;
     options: OCROptions;
   }
   ```

4. **サービス層の分離**:
   - API通信: `services/api/`
   - ビジネスロジック: `services/{domain}/`
   - 状態管理: `contexts/`

#### ファイルサイズ管理
- 小（50-100行）: 定数、型定義
- 中（100-200行）: コンポーネント、フック、APIサービス
- 大（200-300行）: 複雑なコンポーネント
- **300行超過 → 即座に分割**

### 発生した問題と解決

**問題**: なし（初回セッションのため）

### 成果物リスト

- [x] PROJECT_STRUCTURE.md - ディレクトリ構造の詳細設計
- [x] docs/sessions/TODO.md - タスクリスト
- [x] docs/sessions/SUMMARY.md - 進捗サマリー
- [x] docs/sessions/HANDOVER.md - このファイル

#### 5. GitHub連携の完了
- **目的**: プロジェクトをGitHub上で管理

**実施内容**:
1. Gitリポジトリの初期化 (`git init`)
2. .gitignoreの調整（Google Drive、OS固有ファイル除外）
3. 初回コミット作成（48ファイル、2023行追加）
4. GitHub CLIのインストール (`winget install --id GitHub.cli`)
5. GitHubリポジトリ作成とプッシュ (`gh repo create tts-app`)
6. GITHUB_SETUP.md作成（今後の手順ガイド）

**技術的決定事項**:
- リポジトリ管理: GitHub CLI使用
- ブランチ: `main`ブランチ使用
- 認証: GitHub CLI経由で自動化
- セキュリティ: .envファイルは.gitignoreで除外
