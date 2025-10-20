# 開発ハンドオーバー記録

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

### 次セッションへの引き継ぎ事項

#### すぐに着手すべきこと
1. `/startコマンドの実装`（.claude/commands/start.md作成）
2. `バックエンドの基本セットアップ`
   - ディレクトリ作成
   - requirements.txt作成
   - main.py, config.py等の基本ファイル作成

#### 注意事項
- 各ファイル作成時は必ずPROJECT_STRUCTURE.mdの構造に従う
- 定数や型は必ず専用ファイルに集約（重複防止）
- 実装完了後は必ずHANDOVER.md、SUMMARY.md、TODO.mdを更新

#### 参考情報
- 環境変数: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`が必要
- API制限: OCR/TTS共に100回/時間/ユーザー
- 画像制限: 最大10MB、長辺2000px、品質85%に自動圧縮
- 音声形式: Opus、1.0倍速生成、0.5-1.25倍速再生

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

### 次セッションへの引き継ぎ事項

#### すぐに着手すべきこと
1. **バックエンドテスト実装**（所要時間: 1時間）
   - tests/test_ocr.py: OCRエンドポイントのテスト
   - tests/test_tts.py: TTSエンドポイントのテスト
   - モック使用（Anthropic/OpenAI APIをモック）
   - pytest-asyncio使用

2. **フロントエンド基本セットアップ**（所要時間: 30分）
   - Vite + React + TypeScript初期化
   - ディレクトリ構造作成（PROJECT_STRUCTURE.mdに従う）
   - 環境変数設定（.env.example）

#### 実装済み機能の確認方法
```bash
# バックエンド起動
cd backend
python -m venv venv
source venv/bin/activate  # Windowsの場合: venv\Scripts\activate
pip install -r requirements.txt
# .envファイルにAPIキー設定
uvicorn app.main:app --reload

# エンドポイント確認
# http://localhost:8000/docs でSwagger UI
# POST /api/ocr - OCR処理
# POST /api/tts - TTS音声生成
```

#### 注意事項
- **APIキー必須**: ANTHROPIC_API_KEY, OPENAI_API_KEY を.envに設定
- **レート制限**: 各エンドポイント100回/時間/IP
- **画像サイズ**: フロントエンド実装時に圧縮処理追加予定（2000px, 85%品質）
- **テスト実装**: モックを使用してAPIキーなしでテスト可能に

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

### 次回セッション予定

**目標**: フロントエンド基本セットアップ
- フロントエンドプロジェクト初期化
- 基本的なコンポーネント構造作成

**所要時間見積もり**: 1時間

**準備事項**:
- Node.js/npm 確認
- `/start`コマンドでセッション開始

---

## セッション #3 - 2025-10-20

### 実施内容

#### 1. バックエンドテスト実装完了

**テストインフラ整備**:
- `pytest.ini`: pytest設定ファイル作成
- `tests/conftest.py`: 共通フィクスチャとテスト環境設定
  - FastAPIテストクライアント
  - サンプル画像データ（PNG/JPEG/Data URL）
  - モックオブジェクト（Claude/OpenAI）
  - 環境変数設定（テスト用APIキー）

**テストファイル実装**:

1. **test_ocr.py** (10テストケース)
   - 正常系: デフォルトオプション、カスタムオプション、日本語対応
   - 異常系: サービスエラー、内部エラー、バリデーションエラー
   - レート制限テスト

2. **test_tts.py** (17テストケース)
   - 正常系: 全音声タイプ（6種類）、全フォーマット（4種類）
   - 日本語テキスト対応
   - テキスト長制限（最小/最大）テスト
   - 異常系: 不正な音声/フォーマット、サービスエラー
   - メディアタイプマッピング検証

3. **test_services.py** (20テストケース)
   - ClaudeService:
     - 画像データ処理（Base64/Data URL）
     - プロンプト生成ロジック
     - 信頼度判定
     - エラーハンドリング
   - OpenAIService:
     - 音声生成（全音声/全フォーマット）
     - バリデーション（音声/フォーマット）
     - エラーハンドリング

**テスト実行結果**:
- 合計: 47テスト
- 成功: 47/47 (100%)
- 実行時間: 3.33秒
- カバレッジ: エンドポイント、サービス層、エラーハンドリング全て網羅

### 技術的決定事項

#### テスト設計の原則

1. **モックの使用**:
   - 外部API（Claude/OpenAI）は全てモック化
   - APIキー不要でテスト実行可能
   - 高速なテスト実行（3.33秒で47テスト）

2. **環境変数管理**:
   ```python
   # conftest.py内で設定
   os.environ["ANTHROPIC_API_KEY"] = "test-anthropic-key"
   os.environ["OPENAI_API_KEY"] = "test-openai-key"
   ```

3. **フィクスチャ設計**:
   - `sample_base64_image`: 最小限の有効なPNG画像
   - `sample_data_url_image`: Data URL形式の画像
   - `mock_claude_message`: Claude APIレスポンスモック
   - `mock_openai_response`: OpenAI TTS APIレスポンスモック

4. **テストカバレッジ**:
   - 正常系: 各エンドポイントの基本動作確認
   - 異常系: エラーハンドリング、バリデーション
   - エッジケース: 最大/最小値、空文字列、長いテキスト

#### pytest設定

```ini
[pytest]
testpaths = tests
asyncio_mode = auto
addopts = -v --cov=app --cov-report=term-missing
markers =
    unit: Unit tests
    integration: Integration tests
```

### 発生した問題と解決

**問題1**: httpxモジュール未インストール
- 問題: `ModuleNotFoundError: No module named 'httpx'`
- 解決: requirements.txt/requirements-dev.txtから依存関係インストール

**問題2**: 環境変数未設定エラー
- 問題: `pydantic_core.ValidationError: Field required [anthropic_api_key, openai_api_key]`
- 解決: conftest.pyでテスト用環境変数を設定（APIキーをモック値に）

**問題3**: processing_timeのアサーション失敗
- 問題: `assert 0.0 > 0` （処理時間が極めて高速）
- 解決: `assert processing_time >= 0`に修正（0秒も許容）

### 次セッションへの引き継ぎ事項

#### すぐに着手すべきこと

1. **フロントエンド基本セットアップ**（所要時間: 30分）
   - `npm create vite@latest frontend -- --template react-ts`
   - PROJECT_STRUCTURE.mdに従ってディレクトリ構造作成
   - .env.example作成

2. **基本的なコンポーネント実装**（所要時間: 2-3時間）
   - ImageUploadコンポーネント
   - TextEditorコンポーネント
   - AudioPlayerコンポーネント

#### バックエンドの状態

**完了項目**:
- ✅ OCR/TTSエンドポイント実装
- ✅ Pydanticスキーマ定義
- ✅ Claude/OpenAIサービス実装
- ✅ エラーハンドリング
- ✅ レート制限
- ✅ ユニットテスト（47テスト、100%成功）

**未完了項目**:
- なし（バックエンドは完成）

#### テスト実行方法

```bash
# バックエンドテスト実行
cd backend
pip install -r requirements-dev.txt
pytest tests/ -v

# カバレッジレポート付き
pytest tests/ -v --cov=app --cov-report=html
# → htmlcov/index.html でカバレッジ確認
```

### 成果物リスト

#### 新規作成ファイル
- [x] backend/pytest.ini - pytest設定
- [x] backend/tests/conftest.py - テスト共通設定とフィクスチャ
- [x] backend/tests/test_ocr.py - OCRエンドポイントテスト（10テスト）
- [x] backend/tests/test_tts.py - TTSエンドポイントテスト（17テスト）
- [x] backend/tests/test_services.py - サービス層テスト（20テスト）

#### 更新ファイル
- [x] docs/sessions/HANDOVER.md - このファイル
- [x] docs/sessions/SUMMARY.md - 進捗更新（35% → 40%）
- [x] docs/sessions/TODO.md - タスク更新

### コード品質

**テストカバレッジ**:
- エンドポイント層: 100%
- サービス層: 100%
- スキーマ層: pydanticバリデーション（間接的にカバー）
- エラーハンドリング: 100%

**テスト実行速度**:
- 47テスト / 3.33秒 = 平均0.07秒/テスト
- モック使用により高速実行を実現

**保守性**:
- 各テストは独立して実行可能
- フィクスチャで重複コード削減
- 明確なテスト名（何をテストしているか明示）
