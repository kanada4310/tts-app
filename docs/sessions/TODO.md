# TODO

最終更新: 2025-10-26（セッション#19: レスポンシブデザイン完全対応とタッチUI最適化完了）

## 🟢 完了済み（セッション#19で実装完了）

### レスポンシブデザイン完全対応とタッチUI最適化 ✅ 完了

**完了日**: 2025-10-26（セッション#19）
**所要時間**: 約2時間（実績）

- [x] **シークバー下部余白削減（全画面対応）** ✅
  - [x] モバイル版: margin-bottom 60px → 30px
  - [x] PC版: overflow: visible → hidden対応
  - [x] 文番号位置調整
  - 所要時間: 15分
  - ROI: ⭐⭐⭐⭐

- [x] **コンポーネント間余白最適化** ✅
  - [x] PC版: 8px → 16px（基本）、個別16-24px
  - [x] モバイル版: 個別12-20px設定
  - 所要時間: 25分
  - ROI: ⭐⭐⭐⭐⭐

- [x] **画像アップロードUIリファクタリング** ✅
  - [x] TTS生成後はAudioPlayerを最上部に配置
  - [x] 再アップロードボタンを最下部に配置
  - [x] 再アップロードボタンで全状態リセット
  - 所要時間: 20分
  - ROI: ⭐⭐⭐⭐

- [x] **OCR後のテキスト編集バグ修正** ✅
  - [x] handleTextChange追加
  - [x] TextEditorにonTextChange渡す
  - 所要時間: 15分
  - ROI: ⭐⭐⭐⭐⭐

- [x] **文解析精度改善** ✅
  - [x] originalOcrSentences保存
  - [x] 未変更時は高精度OCR結果使用
  - [x] 編集時は改良された文解析（lookahead/lookbehind、略語検出）
  - 所要時間: 30分
  - ROI: ⭐⭐⭐⭐⭐

- [x] **タブレット・モバイル最適化** ✅
  - [x] タブレット対応範囲: 769px-1440px（iPad Pro横向き対応）
  - [x] タッチターゲット: 44-48px（Apple HIG準拠）
  - [x] シークバー: 44px（タブレット・モバイル）
  - [x] 文マーカー: 自動追従（top: 0; bottom: 0;）
  - 所要時間: 30分
  - ROI: ⭐⭐⭐⭐⭐

- [x] **タッチデバイス向けツールチップ** ✅
  - [x] 長押し・スライド時にツールチップ表示
  - [x] 指を離すとセグメント先頭から再生
  - [x] handleTouchStart, handleTouchMove, handleTouchEnd実装
  - 所要時間: 25分
  - ROI: ⭐⭐⭐⭐

- [x] **ツールチップ改善** ✅
  - [x] 半透明白背景（rgba(255,255,255,0.95)）、黒文字（#333）
  - [x] 一定幅（PC: 240px、モバイル: 280px）
  - [x] 画面端はみ出し防止（左右20%で自動調整）
  - 所要時間: 35分
  - ROI: ⭐⭐⭐⭐⭐

- [x] **文リスト自動スクロールデフォルトオフ** ✅
  - [x] useState(true) → useState(false)
  - 所要時間: 5分
  - ROI: ⭐⭐⭐

---

## 🟢 完了済み（セッション#18で実装完了）

### AudioPlayer統合シークバー機能修正 ✅ 完了

**完了日**: 2025-10-25（セッション#18）
**所要時間**: 約1.5時間（実績）

- [x] **シークバークリック機能の修正** ✅
  - [x] git履歴を確認してSession #13の動作していた実装を参考
  - [x] 複雑なHTML構造（progress-track, progress-thumb）を簡略化
  - [x] 直接イベントハンドラーで処理
  - [x] セグメント内シーク vs セグメント切り替えの適切な判定
  - **ファイル**: `frontend/src/components/features/AudioPlayer/components/ProgressBar.tsx`
  - 所要時間: 45分（実績）
  - ROI: ⭐⭐⭐⭐⭐

- [x] **ツールチップ表示の修正** ✅
  - [x] CSS overflow: visible 追加（progress-section, progress-bar-container）
  - [x] padding-top: 40px でツールチップ表示スペース確保
  - [x] マウスオーバー時に文プレビュー表示
  - **ファイル**: `frontend/src/components/features/AudioPlayer/styles.css`
  - 所要時間: 20分（実績）
  - ROI: ⭐⭐⭐⭐⭐

- [x] **重複SentenceListの削除** ✅
  - [x] App.tsx から独立した SentenceList 削除
  - [x] AudioPlayer 統合版のみ使用
  - [x] 未使用変数削除（isPlaying, handleSentenceSeekRequest）
  - **ファイル**: `frontend/src/App.tsx`
  - 所要時間: 10分（実績）
  - ROI: ⭐⭐⭐⭐

- [x] **デバッグログ削除** ✅
  - [x] 全console.logを削除
  - **ファイル**: `frontend/src/components/features/AudioPlayer/components/ProgressBar.tsx`
  - 所要時間: 5分（実績）
  - ROI: ⭐⭐⭐

---

## 🔴 最優先（次回セッション#20）

現在、最優先のタスクはありません。全ての計画タスクが完了しました。

次回セッションでは、以下の方向性から選択できます：
1. UI改善プラン Phase 2-6の実装（インタラクティブ要素、アニメーション）
2. 生徒による実地テストとフィードバック収集
3. PWA対応（Service Worker、オフライン機能）
4. パフォーマンス最適化

---

## 🟡 高優先度（Phase 2-6: UI改善プラン続き）

### UI改善プラン - Phase 2-6（後続フェーズ）

**Phase 2: インタラクティブ要素の強化** (1.5時間)
- [ ] プログレスバーのホバー効果強化
- [ ] 文マーカーのインタラクティブ表示
- [ ] ツールチップのアニメーション改善

**Phase 3: コントロールボタンのアップグレード** (1.5時間)
- [ ] アイコンベースのボタン
- [ ] ホバー/アクティブ状態のアニメーション
- [ ] トグルボタンのビジュアル改善

**Phase 4: 情報表示の改善** (1時間)
- [ ] 現在の文番号の大きな表示
- [ ] リピートカウンターのビジュアル改善
- [ ] 時間表示のタイポグラフィ改善

**Phase 5: 流体アニメーション** (2時間)
- [ ] 再生/一時停止のトランジション
- [ ] 文切り替え時のフェード効果
- [ ] プログレス更新の滑らかなアニメーション

**Phase 6: レスポンシブデザインの最適化** (1.5時間)
- [ ] モバイルレイアウトの調整
- [ ] タッチ操作の改善
- [ ] 画面サイズごとのブレークポイント最適化

**Phase 2-6合計**: 約7.5時間（見積もり）

---

## 🟢 完了済み（セッション#13で実装完了）

### ユーザビリティ改善 - フェーズ1（即時改善）✅ 完了

**目標**: 高校生が使える最低限の日本語化と視覚的フィードバック
**期待効果**: タスク完了率+35%, 初回離脱率-40%
**参照**: [docs/USABILITY_REPORT.md](../USABILITY_REPORT.md)
**完了日**: 2025-10-22（セッション#13）

- [x] **1. 日本語UI対応（全画面）** ✅
  - [x] App.tsx: ヘッダー、エラーバナー、ウェルカムメッセージ
  - [x] ImageUpload: アップロードプロンプト、進捗メッセージ
  - [x] TextEditor: ヘッダー、プレースホルダー、ボタン
  - [x] AudioPlayer: ヘッダー、コントロールボタン、ポーズ設定
  - [x] 新規ファイル: `frontend/src/constants/messages.ts` (83行)
  - 所要時間: 1-2時間（実績: 約1.5時間）
  - ROI: ⭐⭐⭐⭐⭐

- [x] **2. TTS生成の進捗バー** ✅
  - [x] フロントエンド: プログレスバーコンポーネント作成
  - [x] TextEditor: 進捗表示UI（109-118行目）
  - [x] 予想残り時間表示（"約20秒"）
  - [x] アニメーション付きプログレスバー
  - [x] 文数から生成時間を推定（1文あたり約2秒）
  - 所要時間: 2-3時間（実績: 約2時間）
  - ROI: ⭐⭐⭐⭐⭐

- [x] **3. エラーメッセージの具体化** ✅
  - [x] 画像処理エラー: サイズ、形式、接続の確認手順
  - [x] TTS生成エラー: 文字数、接続の確認手順
  - [x] OCRエラー: 画像品質、形式の確認手順
  - [x] messages.ts: 詳細なエラーメッセージ追加
  - 所要時間: 1-2時間（実績: 約1時間）
  - ROI: ⭐⭐⭐⭐

- [x] **4. 速度プリセット1.5x, 2.0x追加** ✅
  - [x] AudioPlayer: プリセットを6つに拡大（0.5x, 0.75x, 1.0x, 1.25x, 1.5x, 2.0x）
  - [x] レイアウト調整（横並び維持）
  - 所要時間: 30分（実績: 30分）
  - ROI: ⭐⭐⭐⭐

- [x] **5. 文字数制限の明示** ✅
  - [x] TextEditor: "350 / 100,000 文字"表示
  - [x] 90,000文字超: 黄色警告（"上限に近づいています"）
  - [x] 100,000文字超: 赤色警告（"上限を超えています。音声生成できません。"）
  - [x] CSS: 警告時の色分け（warning, error）
  - 所要時間: 30分（実績: 30分）
  - ROI: ⭐⭐⭐

- [x] **6. アップロード前の制限警告** ✅
  - [x] ImageUpload: 最大10枚の明示（"※ 最大10枚までアップロード可能"）
  - [x] 11枚以上選択時: 自動で最初の10枚のみ処理＋警告バナー表示
  - [x] CSS: 警告バナー（アニメーション付き）
  - 所要時間: 1時間（実績: 1時間）
  - ROI: ⭐⭐⭐⭐

**フェーズ1合計**: 6-9時間（実績: 約6.5時間）

---

### 生徒向け使用ガイド作成

- [x] **USER_GUIDE.md作成** ✅
  - [x] アプリURL（https://tts-app-ycaz.vercel.app）と概要
  - [x] 基本的な使い方（画像アップロード→OCR→TTS→再生）
  - [x] 各機能の説明（速度調整、ポーズ機能、文ナビゲーション）
  - [x] トラブルシューティング（よくある問題と解決方法）
  - 所要時間: 30分（実績: 15分）

### デプロイ関連（✅ 完了）

- [x] **Railwayへのバックエンドデプロイ** ✅
  - [x] Railwayアカウント作成
  - [x] プロジェクト作成とGitHub連携
  - [x] 環境変数設定（GEMINI_API_KEY, OPENAI_API_KEY）
  - [x] デプロイ実行とURL確認
  - [x] ffmpegインストール設定（aptfile）
  - [x] クロスプラットフォーム対応（openai_service.py）
  - [x] google-generativeai依存関係追加

- [x] **Vercelへのフロントエンドデプロイ** ✅
  - [x] Vercelアカウント作成
  - [x] プロジェクトインポートとGitHub連携
  - [x] 環境変数設定（VITE_API_BASE_URL）
  - [x] デプロイ実行とURL確認
  - [x] TypeScriptビルドエラー修正

- [x] **Railwayポート設定とCORSエラー解決** ✅（セッション#11）
  - [x] GitHubへ最新コードをプッシュ
  - [x] Railway Settings → Networking → Port = 8080に設定
  - [x] Railwayの自動再デプロイ確認
  - [x] CORS設定の検証（Preflightリクエスト確認）

- [x] **E2E動作確認** ✅（セッション#11）
  - [x] 画像アップロード → OCR
  - [x] TTS音声生成
  - [x] 音声再生、速度調整、ポーズ機能
  - [x] ブラウザコンソールでエラーがないことを確認

## 🔴 最優先（セッション#18未完了タスク）

### AudioPlayer統合シークバー機能修正

**目標**: シークバークリックとツールチップ表示を機能させる
**現状**: イベントハンドラーが発火していない（要素が重なっている可能性）
**緊急度**: 🔴 最優先

- [ ] **シークバークリックの修正** ❌ 未完了
  - [ ] ブラウザ開発者ツールで要素を検査
  - [ ] シークバーを覆っている要素を特定
  - [ ] z-index/pointer-events/HTML構造を修正
  - [ ] `[ProgressBar] onClick fired`が表示されることを確認
  - 所要時間: 30分-1時間（見積もり）
  - ROI: ⭐⭐⭐⭐⭐

- [ ] **ツールチップ表示の修正** ❌ 未完了
  - [ ] マウスオーバーイベントが発火することを確認
  - [ ] `[ProgressBar] onMouseMove fired`が表示されることを確認
  - [ ] ツールチップに文のプレビューが表示されることを確認
  - 所要時間: 10分-30分（シークバー修正後）
  - ROI: ⭐⭐⭐⭐

- [ ] **デバッグログの削除** ❌ 未完了
  - [ ] `ProgressBar.tsx`の全デバッグログを削除
  - [ ] 本番用コードをクリーンに
  - 所要時間: 5分
  - ROI: ⭐⭐⭐

**次回セッション開始手順**:
1. ブラウザ開発者ツールでシークバー要素を検査
2. 重なっている要素を特定して修正
3. シークバークリックとツールチップの動作確認
4. デバッグログを削除
5. コミット・プッシュ

---

## 🟡 高優先度

### ユーザビリティ改善 - フェーズ2（使いやすさ向上）✅ 完了

**目標**: 機能発見率とモバイル体験の改善
**期待効果**: 機能利用率+50%, モバイル完了率+25%, 満足度+35%
**参照**: [docs/USABILITY_REPORT.md](../USABILITY_REPORT.md)
**完了日**: 2025-10-22（セッション#13）

- [x] **7. 初回チュートリアル/ツールチップ** ✅
  - [x] Tutorialコンポーネント作成（オーバーレイ式）
  - [x] 3ステップガイド実装
  - [x] localStorage で初回フラグ管理
  - [x] ESCキーで閉じる機能
  - 所要時間: 約3時間（実績）
  - ROI: ⭐⭐⭐⭐⭐

- [x] **8. 画像の個別削除機能** ✅
  - [x] プレビュー画像に「×」ボタン追加
  - [x] 削除後の自動再OCR実装
  - [x] フェードインアニメーション
  - [x] ProcessedImage型導入（dataUrl + base64）
  - 所要時間: 約2時間（実績）
  - ROI: ⭐⭐⭐⭐

- [x] **9. モバイルUI最適化** ✅
  - [x] シークバー高さ: 8px → 16px（スマホ時）
  - [x] コントロールボタン: 48px → 44px（スマホ時、Apple HIG準拠）
  - [x] プレイヤー固定ヘッダー化（position: sticky）
  - [x] タップエリア拡大（44px以上）
  - [x] viewport設定更新（index.html）
  - 所要時間: 約4時間（実績）
  - ROI: ⭐⭐⭐⭐

- [x] **10. キーボードショートカット** ✅
  - [x] Space/K: 再生/一時停止
  - [x] 左右矢印: 前/次の文
  - [x] 上下矢印: 速度調整
  - [x] 「?」キー: ショートカット一覧表示
  - [x] input/textareaフィールドで無効化
  - 所要時間: 約3時間（実績）
  - ROI: ⭐⭐⭐

**フェーズ2合計**: 10-14時間（実績: 約12時間）

---

### 基本実装（完了）

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

## 🟢 完了済み（セッション#16で実装完了）

### ユーザビリティ改善 - フェーズ3A: モバイル操作性の改善 ✅

**目標**: スマホでのシークバー操作を快適にする
**期待効果**: モバイル操作性+100%、機能発見率+300%、タスク完了率+15%
**参照**: [docs/USABILITY_REPORT.md](../USABILITY_REPORT.md) - モバイルユーザビリティの追加問題
**追加日**: 2025-10-22（セッション#15）
**完了日**: 2025-10-22（セッション#16）

- [x] **1. シークバー高さを44pxに拡大** ✅
  - [x] モバイル時のシークバー高さを16px → 44pxに変更（速度スライダーと統一）
  - [x] border-radius調整（12px → 22px）
  - **ファイル**: `frontend/src/components/features/AudioPlayer/styles.css`
  - 所要時間: 15分（実績）
  - ROI: ⭐⭐⭐⭐⭐

- [x] **2. スライド操作実装** ✅
  - [x] `isDragging` state追加
  - [x] `calculateSeekPosition` 関数実装
  - [x] `handleTouchStart`, `handleTouchMove`, `handleTouchEnd` 実装
  - [x] `e.preventDefault()` でスクロール防止
  - **ファイル**: `frontend/src/components/features/AudioPlayer/AudioPlayer.tsx`
  - 所要時間: 30分（実績）
  - ROI: ⭐⭐⭐⭐⭐

- [x] **3. スライド中にツールチップ常時表示** ✅
  - [x] `updateTooltip` 関数実装
  - [x] useEffectで`isDragging`中にツールチップ強制表示
  - [x] スライド終了後、3秒で自動消去
  - **ファイル**: `frontend/src/components/features/AudioPlayer/AudioPlayer.tsx`
  - 所要時間: 30分（実績、タスク2と統合）
  - ROI: ⭐⭐⭐⭐⭐

- [x] **4. 文境界マーカー拡大** ✅
  - [x] マーカー幅: 4px → 8px
  - [x] マーカー高さ: 16px → 44px（シークバーと統一）
  - **ファイル**: `frontend/src/components/features/AudioPlayer/styles.css`
  - 所要時間: 15分（実績）
  - ROI: ⭐⭐⭐⭐

- [x] **5. 文番号表示修正** ✅
  - [x] デスクトップ: シークバー上に配置（`top: -24px`）
  - [x] モバイル: シークバー下に配置（`bottom: -24px`）
  - [x] `font-size: 12px`（モバイル）
  - [x] 20文以上の場合は5の倍数のみ表示
  - **ファイル**: `frontend/src/components/features/AudioPlayer/styles.css`
  - 所要時間: 15分（実績）
  - ROI: ⭐⭐⭐⭐

**フェーズ3A（モバイル操作性）合計**: 1.5時間（実績）

---

### 文リスト機能実装 ✅

**目標**: 音声生成後、テキストを文リストで表示し、学習体験を向上
**期待効果**: 文の把握+100%、ナビゲーション性+200%
**追加日**: 2025-10-22（セッション#15）
**完了日**: 2025-10-22（セッション#16）

- [x] **1. App.tsx で表示切り替え** ✅
  - [x] 音声生成前: TextEditor表示
  - [x] 音声生成後: SentenceList表示（自動切り替え）
  - [x] `handleSentenceSeek` 関数実装
  - **ファイル**: `frontend/src/App.tsx`
  - 所要時間: 20分（実績）

- [x] **2. SentenceList コンポーネント作成** ✅
  - [x] Props定義（sentences, sentenceTimings, currentSentenceIndex, isPlaying, onSentenceClick）
  - [x] 折り畳み機能（`isCollapsed` state）
  - [x] 可視範囲制御（現在文+前後3文を強調表示）
  - [x] 自動スクロール（トグル可能、`autoScroll` state）
  - [x] 文クリックでシーク機能
  - [x] カード型デザイン、モバイル最適化
  - **新規ファイル**: `frontend/src/components/features/SentenceList/SentenceList.tsx` (123行)
  - **新規ファイル**: `frontend/src/components/features/SentenceList/index.ts` (2行)
  - **新規ファイル**: `frontend/src/components/features/SentenceList/styles.css` (211行)
  - 所要時間: 1.5時間（実績、タスク2-6統合）

- [x] **3. AudioPlayer 型更新** ✅
  - [x] `onSentenceChange?: (index: number) => void` 追加
  - [x] `onPlayStateChange?: (isPlaying: boolean) => void` 追加
  - **ファイル**: `frontend/src/components/features/AudioPlayer/AudioPlayer.tsx`
  - 所要時間: 20分（実績）

**文リスト機能合計**: 2時間（実績）

---

### 学習効果向上 - フェーズ3A: アクティブ学習支援 ✅

**目標**: 「聞くだけ」から「練習できる」アプリへ進化
**期待効果**: 学習効果+40%、シャドーイング/オーバーラッピング練習が可能に
**参照**: [docs/LEARNING_ENHANCEMENT.md](../LEARNING_ENHANCEMENT.md)
**追加日**: 2025-10-22（セッション#15）
**完了日**: 2025-10-22（セッション#15）
**理論的背景**: 第二言語習得論（SLA）、大学受験英語のノウハウ

- [x] **1. リピート再生機能** ✅
  - [x] 1文を指定回数（1回、3回、5回、無限）自動リピート
  - [x] 再生後に自動で次の文へ（autoAdvanceチェックボックス）
  - [x] リピートカウンター表示（例: "2 / 3"）
  - [x] `repeatCount`, `currentRepeat`状態管理
  - [x] `handleAudioEnded`関数でリピート・自動移動ロジック実装
  - **ファイル**: `frontend/src/components/features/AudioPlayer/AudioPlayer.tsx` (920-948行)
  - **ファイル**: `frontend/src/components/features/AudioPlayer/styles.css`
  - 所要時間: 1-2時間（実績）
  - ROI: ⭐⭐⭐⭐⭐
  - **学習効果**: オーバーラッピング、シャドーイング練習が容易に

- [x] **2. 文ごとの一時停止機能** ✅
  - [x] 1文再生後、自動で一時停止
  - [x] ユーザーが発音練習 → スペースキーで次の文へ
  - [x] `autoPauseAfterSentence`状態
  - [x] `handleAudioEnded`内で一時停止判定
  - [x] UIチェックボックス実装
  - **ファイル**: `frontend/src/components/features/AudioPlayer/AudioPlayer.tsx` (959-968行)
  - 所要時間: 30分-1時間（実績）
  - ROI: ⭐⭐⭐⭐⭐
  - **学習効果**: 音読練習のペースをアプリが管理

- [x] **3. テキスト表示/非表示切り替え（文リスト機能に置き換え）** ✅
  - [x] 音声生成前: TextEditor表示
  - [x] 音声生成後: SentenceList表示（自動切り替え）
  - [x] SentenceListの折り畳み機能で実質的な表示/非表示を実現
  - **実装**: 文リスト機能として実装済み（セッション#16）
  - **学習効果**: より高度な文単位のナビゲーションが可能に

**フェーズ3A（学習効果）合計**: 1.5-3時間（実績: セッション#15で実装完了）

---

## 🟢 完了済み（セッション#17で実装完了）

### リピート機能バグ修正 ✅ 完了

**完了日**: 2025-10-23（セッション#17前半）

- [x] **重複リピートシステムの完全削除** ✅
  - [x] 旧handleAudioEnded()のリピートロジック（47行）を削除
  - [x] SentenceTriggerManagerに一本化
  - 所要時間: 15分（実績）

- [x] **文末検出ウィンドウの修正** ✅
  - [x] 検出範囲を95%-105% → 95%-100%に変更
  - [x] 過去の文の誤検出を防止
  - 所要時間: 5分（実績）

- [x] **再生開始時の初期化処理追加** ✅
  - [x] processedSentenceEndsRef.clear()実装
  - [x] 文0から確実に検出開始
  - 所要時間: 10分（実績）

- [x] **sentenceTriggerManager.ts 新規作成** ✅
  - [x] トリガー管理を一元化
  - 所要時間: 設計済み（前回セッション）

### 音声分割方式の基盤実装 ✅ 完了（バックエンド完全、フロントエンド準備完了）

**完了日**: 2025-10-23（セッション#17中盤〜後半）
**参照**: [docs/SEPARATED_AUDIO_DESIGN.md](../SEPARATED_AUDIO_DESIGN.md)

#### バックエンド実装（100%完了）

- [x] **generate_speech_separated() 関数実装** ✅
  - [x] 既存コードから結合処理を削除
  - [x] base64エンコードして配列で返す
  - [x] 各文の音声データを個別に返却
  - **ファイル**: `backend/app/services/openai_service.py`
  - 所要時間: 20分（実績）

- [x] **/api/tts-with-timings-separated エンドポイント追加** ✅
  - [x] JSONで音声セグメント配列を返却
  - [x] レート制限: 100/hour
  - **ファイル**: `backend/app/api/routes/tts.py`
  - 所要時間: 15分（実績）

- [x] **スキーマ定義追加** ✅
  - [x] AudioSegment, TTSResponseSeparated 追加
  - **ファイル**: `backend/app/schemas/tts.py`
  - 所要時間: 5分（実績）

- [x] **Python構文チェック完了** ✅
  - 所要時間: 3分（実績）

#### フロントエンド実装（API層完了、AudioPlayer改造は次回）

- [x] **API定数追加** ✅
  - [x] TTS_WITH_TIMINGS_SEPARATED 追加
  - **ファイル**: `frontend/src/constants/api.ts`
  - 所要時間: 5分（実績）

- [x] **performTTSSeparated() API関数実装** ✅
  - [x] base64デコード、Blob配列生成
  - [x] 各セグメントのduration取得
  - **ファイル**: `frontend/src/services/api/tts.ts`
  - 所要時間: 15分（実績）

- [x] **App.tsx完全対応** ✅
  - [x] audioSegments, segmentDurations state追加
  - [x] handleGenerateSpeech()を分離方式に変更
  - [x] AudioPlayerに新props渡す
  - **ファイル**: `frontend/src/App.tsx`
  - 所要時間: 20分（実績）

- [x] **AudioPlayer Props更新** ✅
  - [x] audioSegments, segmentDurations props追加
  - **ファイル**: `frontend/src/components/features/AudioPlayer/AudioPlayer.tsx`
  - 所要時間: 5分（実績）

#### ドキュメント作成

- [x] **詳細設計書作成** ✅
  - [x] バックエンド・フロントエンドの完全な実装計画
  - [x] API利用料増加ゼロの確認
  - [x] 段階的移行戦略、互換性維持
  - **ファイル**: `docs/SEPARATED_AUDIO_DESIGN.md` (1,200行)
  - 所要時間: 1時間（実績）

### AudioPlayerリファクタリング計画 ✅ 計画書完成

**完了日**: 2025-10-23（セッション#17終盤）
**参照**: [docs/AUDIOPLAYER_REFACTORING.md](../AUDIOPLAYER_REFACTORING.md)

- [x] **リファクタリング計画書作成** ✅
  - [x] Hooksベースの設計（useAudioSegments, useRepeatControl など）
  - [x] 各ファイル200-300行以内に分割
  - [x] 詳細なAPI設計、実装順序
  - [x] 成功基準（機能要件・非機能要件）
  - **ファイル**: `docs/AUDIOPLAYER_REFACTORING.md` (700行)
  - 所要時間: 30分（実績）

**セッション#17合計**: 約3時間

---

## 🔴 最優先（次回セッション#18）

### AudioPlayerリファクタリング + 音声分割方式完全実装

**目標**: リピート機能を完璧に動作させる
**期待効果**: バグ完全解決、コード保守性向上
**参照**:
- [docs/AUDIOPLAYER_REFACTORING.md](../AUDIOPLAYER_REFACTORING.md)
- [docs/SEPARATED_AUDIO_DESIGN.md](../SEPARATED_AUDIO_DESIGN.md)

#### フェーズ1: Hooks実装（2時間）

- [ ] **types.ts 作成**
  - [ ] PlaybackState, SentenceState, RepeatState, SegmentState 定義
  - **ファイル**: `frontend/src/components/features/AudioPlayer/types.ts`
  - 所要時間: 15分

- [ ] **useAudioSegments.ts 実装（⭐最重要）**
  - [ ] 音声セグメントの管理
  - [ ] Blob URLの生成・クリーンアップ
  - [ ] セグメント切り替え機能
  - [ ] プリロード機能
  - **ファイル**: `frontend/src/components/features/AudioPlayer/hooks/useAudioSegments.ts`
  - 所要時間: 45分

- [ ] **useRepeatControl.ts 実装**
  - [ ] リピート回数管理
  - [ ] 自動進行制御
  - **ファイル**: `frontend/src/components/features/AudioPlayer/hooks/useRepeatControl.ts`
  - 所要時間: 20分

- [ ] **useAudioPlayback.ts 実装**
  - [ ] 基本再生制御（play, pause, setSpeed, seek）
  - **ファイル**: `frontend/src/components/features/AudioPlayer/hooks/useAudioPlayback.ts`
  - 所要時間: 30分

- [ ] **useSentenceNavigation.ts 実装**
  - [ ] 文の前後移動
  - **ファイル**: `frontend/src/components/features/AudioPlayer/hooks/useSentenceNavigation.ts`
  - 所要時間: 20分

- [ ] **usePauseControl.ts 実装**
  - [ ] 文間のポーズ設定
  - **ファイル**: `frontend/src/components/features/AudioPlayer/hooks/usePauseControl.ts`
  - 所要時間: 15分

- [ ] **useKeyboardShortcuts.ts 実装**
  - [ ] キーボードイベントハンドリング
  - **ファイル**: `frontend/src/components/features/AudioPlayer/hooks/useKeyboardShortcuts.ts`
  - 所要時間: 15分

#### フェーズ2: UIコンポーネント実装（1.5時間）

- [ ] **PlaybackControls.tsx 実装**
  - [ ] 再生/一時停止ボタン
  - [ ] 速度プリセット
  - **ファイル**: `frontend/src/components/features/AudioPlayer/components/PlaybackControls.tsx`
  - 所要時間: 30分

- [ ] **ProgressBar.tsx 実装（簡略化）**
  - [ ] シークバー（分離モードでは簡略）
  - [ ] 文マーカー不要（各文が独立しているため）
  - **ファイル**: `frontend/src/components/features/AudioPlayer/components/ProgressBar.tsx`
  - 所要時間: 30分

- [ ] **SentenceControls.tsx 実装**
  - [ ] 前の文/次の文ボタン
  - **ファイル**: `frontend/src/components/features/AudioPlayer/components/SentenceControls.tsx`
  - 所要時間: 15分

- [ ] **RepeatSettings.tsx 実装**
  - [ ] リピート回数選択
  - [ ] 自動進行チェックボックス
  - **ファイル**: `frontend/src/components/features/AudioPlayer/components/RepeatSettings.tsx`
  - 所要時間: 20分

- [ ] **ShortcutsHelp.tsx 実装**
  - [ ] ショートカット一覧モーダル
  - **ファイル**: `frontend/src/components/features/AudioPlayer/components/ShortcutsHelp.tsx`
  - 所要時間: 15分

#### フェーズ3: メインコンポーネント統合（1時間）

- [ ] **既存AudioPlayer.tsxをバックアップ**
  - [ ] AudioPlayer.legacy.tsx として保存
  - 所要時間: 5分

- [ ] **新AudioPlayer.tsx実装**
  - [ ] Hooksとコンポーネントの統合
  - [ ] handleSegmentEnded() 実装
  - [ ] 状態管理の調整
  - **ファイル**: `frontend/src/components/features/AudioPlayer/AudioPlayer.tsx`
  - 所要時間: 40分

- [ ] **TypeScriptコンパイル確認**
  - 所要時間: 10分

- [ ] **スタイル調整**
  - 所要時間: 5分

#### フェーズ4: E2Eテスト（30分）

- [ ] **ローカル環境テスト**
  - [ ] 音声分離モードで再生
  - [ ] リピート3回動作確認（1/3, 2/3, 3/3の表示）
  - [ ] 文ナビゲーション確認
  - [ ] ポーズ機能確認
  - [ ] キーボードショートカット確認
  - 所要時間: 20分

- [ ] **バグ修正・調整**
  - 所要時間: 10分

**フェーズ合計**: 約5時間

---

## 🟡 高優先度

### ユーザビリティ改善 - フェーズ3B: レイアウト改善

**目標**: スマホでの視認性とレイアウトを最適化
**期待効果**: 視認性+15点、画面領域の有効活用+40%

- [ ] **6. プリセットボタンを2列3行に配置（スマホのみ）**
  - [ ] 現在: 6つのボタンが横並び（0.5x, 0.75x, 1.0x, 1.25x, 1.5x, 2.0x）
  - [ ] スマホ時: 2列3行のグリッドレイアウトに変更
  - [ ] `display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;`
  - **ファイル**: `frontend/src/components/features/AudioPlayer/styles.css`
  - 所要時間: 30分
  - ROI: ⭐⭐⭐

- [ ] **7. プレイヤーの折りたたみ機能（オプション）**
  - [ ] 最小化ボタン追加（再生/一時停止、速度、シークバーのみ表示）
  - [ ] ポーズ設定、文ナビゲーションを非表示
  - [ ] 展開ボタンで全機能を再表示
  - **ファイル**: `frontend/src/components/features/AudioPlayer/AudioPlayer.tsx`
  - **ファイル**: `frontend/src/components/features/AudioPlayer/styles.css`
  - 所要時間: 2時間
  - ROI: ⭐⭐

**フェーズ3B合計**: 0.5-2.5時間

---

### 学習効果向上 - フェーズ3B: 学習管理・記録（高優先度）

**目標**: 継続性向上とモチベーション維持
**期待効果**: 継続日数+114%, 復習効率+50%, モチベーション+25%

- [ ] **4. 学習記録（練習履歴）**
  - [ ] 練習した日時、教材名、再生回数、総学習時間を記録
  - [ ] カレンダー形式で継続日数を可視化
  - [ ] localStorage使用（サーバー不要）
  - [ ] `LearningHistory.tsx`コンポーネント作成
  - [ ] `services/learningHistory.ts`でデータ管理
  - 所要時間: 3-4時間
  - ROI: ⭐⭐⭐⭐
  - **学習効果**: Duolingo式の連続記録、モチベーション維持

- [ ] **5. お気に入り・ブックマーク機能**
  - [ ] 特定の文をブックマーク（星マーク）
  - [ ] ブックマークした文のみを再生するモード
  - [ ] 苦手な文を重点的に練習
  - [ ] `sentences`に`bookmarked: boolean`を追加
  - [ ] localStorage保存（教材ごと）
  - 所要時間: 2-3時間
  - ROI: ⭐⭐⭐⭐
  - **学習効果**: 弱点克服に集中、効率的な復習

- [ ] **6. 速度変更の段階的練習モード**
  - [ ] 初回: 0.75x → 2回目: 1.0x → 3回目: 1.25x のように自動で速度UP
  - [ ] 段階的に難易度を上げる仕組み
  - [ ] `progressiveMode`状態、全文再生終了時に速度を自動変更
  - 所要時間: 2時間
  - ROI: ⭐⭐⭐
  - **学習効果**: 音読の段階的トレーニング（受験英語のノウハウ）

**フェーズ3B（学習効果）合計**: 7-9時間

---

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
