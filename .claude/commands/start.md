---
description: セッション開始時にプロジェクトの状態を把握する
---

# セッション開始プロトコル

## フェーズ1: 基本ドキュメント読み込み（必須）

以下のドキュメントを**順番に**読み込んでプロジェクトの状態を把握してください:

1. **docs/sessions/TODO.md** - 次に実施すべきタスク（最優先で確認）
2. **docs/sessions/SUMMARY.md** - 現在の実装状況と進捗
3. **docs/sessions/HANDOVER.md** - 詳細な作業履歴と技術的決定事項

## フェーズ2: コンテキスト分析と追加ファイル判定

TODO.mdの最優先タスク（🔴マーク）を確認し、以下の判定ロジックに従って**自動的に追加ファイルを読み込む**:

### 判定ルール

#### ルール1: バックエンド関連タスクの場合
TODO.mdに以下のキーワードが含まれる場合:
- `OCR`, `TTS`, `API`, `エンドポイント`, `バックエンド`, `FastAPI`, `Python`

**追加で読み込むファイル:**
- `docs/API.md` - API仕様
- `backend/app/main.py` - FastAPIアプリ
- `backend/app/core/config.py` - 設定
- `backend/app/core/constants.py` - 定数
- TODO内容に応じて:
  - OCR関連 → `backend/app/api/routes/ocr.py`
  - TTS関連 → `backend/app/api/routes/tts.py`

#### ルール2: フロントエンド関連タスクの場合
TODO.mdに以下のキーワードが含まれる場合:
- `フロントエンド`, `React`, `コンポーネント`, `UI`, `画面`, `TypeScript`

**追加で読み込むファイル:**
- `frontend/src/App.tsx` - メインアプリ
- `frontend/src/constants/` - 定数ファイル群
- `frontend/src/types/` - 型定義ファイル群
- TODO内容に応じて:
  - 画像アップロード → `frontend/src/components/features/ImageUpload/` (存在すれば)
  - テキスト編集 → `frontend/src/components/features/TextEditor/` (存在すれば)
  - 音声再生 → `frontend/src/components/features/AudioPlayer/` (存在すれば)

#### ルール3: インフラ・設定関連タスクの場合
TODO.mdに以下のキーワードが含まれる場合:
- `デプロイ`, `CI/CD`, `Docker`, `環境構築`, `インフラ`

**追加で読み込むファイル:**
- `docs/ARCHITECTURE.md` - アーキテクチャ
- `backend/.env.example` - 環境変数テンプレート
- `frontend/.env.example` - 環境変数テンプレート
- 存在すれば: `docker-compose.yml`, `.github/workflows/`

#### ルール4: ドキュメント・仕様関連タスクの場合
TODO.mdに以下のキーワードが含まれる場合:
- `仕様`, `ドキュメント`, `README`, `設計`

**追加で読み込むファイル:**
- `docs/SPECIFICATION.md` - 機能仕様
- `docs/ARCHITECTURE.md` - アーキテクチャ
- `PROJECT_STRUCTURE.md` - プロジェクト構造

#### ルール5: 新規機能実装の場合
TODO.mdに「新規」「追加」「実装」が含まれ、まだファイルが存在しない場合:

**追加で読み込むファイル:**
- `PROJECT_STRUCTURE.md` - ディレクトリ構造とコーディング規約
- `docs/SPECIFICATION.md` - 機能仕様
- 該当する既存の類似ファイル（参考実装として）

#### デフォルト（判定不能の場合）
上記のいずれにも該当しない、または複数の領域にまたがる場合:

**追加で読み込むファイル:**
- `docs/SPECIFICATION.md` - 機能仕様
- `docs/ARCHITECTURE.md` - アーキテクチャ
- `PROJECT_STRUCTURE.md` - プロジェクト構造

## フェーズ3: タスク開始前の確認

追加ファイルを読み込んだ後、以下を確認:

1. **依存関係のチェック**
   - 他のファイルや機能に影響がないか
   - 必要な定数や型が既に定義されているか

2. **コーディング規約の確認**
   - ファイルサイズ制限（200-300行）
   - 重複コードの有無
   - 定数・型の一元管理

3. **既存実装との整合性**
   - 似た機能が既に実装されていないか
   - 既存のパターンやアーキテクチャに従っているか

## フェーズ4: タスク実行

TODO.mdの最優先タスク（🔴マーク）から作業を開始してください。

作業中は以下を意識:
- **段階的な実装**: 小さく分けて実装し、都度確認
- **テスト**: 可能な範囲でテストを書く
- **ドキュメント**: コードにコメントを追加

## フェーズ5: 作業完了時の更新（必須）

作業完了時は**必ず**以下を更新:

1. **HANDOVER.md**
   - 実施内容の詳細
   - 技術的決定事項
   - 発生した問題と解決方法
   - 次回への引き継ぎ事項

2. **SUMMARY.md**
   - 進捗率の更新
   - 完了項目のチェック
   - 新規追加項目の記載

3. **TODO.md**
   - 完了タスクをチェック
   - 新しく発生したタスクを追加
   - 優先度の見直し

## 実行例

```
セッション開始 → /start

1. TODO.md読み込み
   → 最優先: "OCRエンドポイント実装"

2. 自動判定
   → キーワード: "OCR", "エンドポイント"
   → ルール1適用: バックエンド関連

3. 追加ファイル読み込み
   → docs/API.md
   → backend/app/api/routes/ocr.py
   → backend/app/core/constants.py

4. タスク実行
   → OCRエンドポイント実装開始...

5. 完了後、セッション管理ファイル更新
```

## 注意事項

- ファイルが存在しない場合はスキップ（エラーにしない）
- 大量のファイル（10個以上）が必要な場合は、最も重要な5-7個に絞る
- 読み込んだファイルは必ず活用し、重複実装を避ける
- 不明点があれば、追加でファイルを読み込んでから作業開始
