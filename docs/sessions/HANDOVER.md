# 開発ハンドオーバー記録

> このファイルには最新のセッション情報のみを記載します。
> 過去のセッション履歴は [SESSION_HISTORY.md](SESSION_HISTORY.md) を参照してください。

---

## セッション #30 - 2025-11-08（✅ 完了）

### 実施内容

このセッションでは、**Railway＋Vercelデプロイ更新とSupabase移行の本番環境完全統合**を完了しました。環境変数設定、SPAルーティング修正、Supabase URL設定を実施し、本番環境でのE2Eテストをすべて成功させました。

#### 1. Railway環境変数設定（15分）

**実施内容**:
- Railway Dashboard → Variables で環境変数追加
  - `SUPABASE_URL`: SupabaseプロジェクトURL
  - `SUPABASE_SERVICE_KEY`: Service roleキー（⚠️公開禁止）

**結果**:
- Railwayが自動再デプロイ
- バックエンドでSupabase機能が有効化

---

#### 2. Vercel環境変数設定（15分）

**実施内容**:
- Vercel Dashboard → Settings → Environment Variables で環境変数追加
  - `VITE_SUPABASE_URL`: SupabaseプロジェクトURL
  - `VITE_SUPABASE_ANON_KEY`: 匿名キー（公開可能）

**問題**: 環境変数追加後も反映されない

**原因**: Vercelは環境変数追加後、自動再デプロイされない

**解決**: 手動で再デプロイを実行

---

#### 3. vercel.json作成（SPAルーティング設定）（15分）

**問題**:
```
GET https://tts-xxx.vercel.app/login 404 (Not Found)
```

**原因**: React Router（BrowserRouter）を使用しているSPAでは、Vercelにルーティング設定が必要

**解決**:
- `frontend/vercel.json` を作成
- すべてのルート（`/login`, `/signup`, `/` など）を `index.html` にリダイレクト

**変更ファイル**: `frontend/vercel.json`

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**技術的決定**:
- **rewrites vs redirects**: rewritesは内部リダイレクト（URLは変わらない）、redirectsは外部リダイレクト（URLが変わる）。SPAではrewritesが適切。

---

#### 4. Supabase URL Configuration設定（10分）

**問題**:
```
このサイトにアクセスできません
localhost で接続が拒否されました。
```

**原因**: SupabaseのSite URLが `http://localhost:5173` のままで、OAuth認証後にlocalhostへリダイレクトされる

**解決**:
- Supabase Dashboard → Authentication → URL Configuration
  - **Site URL**: `https://tts-app-ycaz.vercel.app` に変更
  - **Redirect URLs**: `https://tts-app-ycaz.vercel.app/**` を追加

**技術的決定**:
- **Site URL**: OAuth認証後のデフォルトリダイレクト先
- **Redirect URLs**: Supabaseが許可するリダイレクト先のホワイトリスト（`/**` はワイルドカード）

---

#### 5. 本番環境E2Eテスト（30分）

**✅ テスト1: Google OAuth認証テスト**
- Googleアカウントでログイン成功
- ログアウト機能正常
- ブラウザコンソールエラーなし

**✅ テスト2: 音声キャッシュテスト**
- 1回目のTTS生成: `from_cache: false`（約5〜10秒）
- 2回目のTTS生成: `from_cache: true`（約1〜2秒）
- Supabase Storageに音声ファイル保存確認
- OpenAI APIコスト削減効果を確認

**✅ テスト3: ブックマーク音声再生テスト**
- ブックマーク作成成功（☆ → ★）
- ブックマークリストに表示
- 「🔊 この文から音声再生」ボタンで指定した文から再生成功
- ブラウザコンソールエラーなし

---

### 技術的決定事項

#### 決定1: Vercel SPAルーティング設定

**問題**: React Routerの `/login`, `/signup` などのルートが404エラー

**決定**: `vercel.json` でrewritesを設定

**理由**:
- Vercelは物理的なファイル（`/login.html`）を探すが、SPAでは存在しない
- すべてのルートを `index.html` にリダイレクトし、React Routerに処理を任せる

**代替案**:
- HashRouter（`/#/login`）: URLが汚い、SEOに不利
- Next.js: オーバースペック、既存構成の大幅変更が必要

---

#### 決定2: Supabase Site URL設定

**問題**: OAuth認証後にlocalhostへリダイレクトされる

**決定**: Site URLを本番URLに変更

**理由**:
- ローカル開発時は `http://localhost:5173` を設定
- 本番環境では `https://tts-app-ycaz.vercel.app` に変更が必要
- Site URLはOAuth認証後のデフォルトリダイレクト先として使用される

**注意**:
- Redirect URLsには複数のURLを設定可能（本番URL + ローカルURL）
- `/**` ワイルドカードですべてのパスを許可

---

### 発生した問題と解決

#### 問題1: Supabase環境変数が反映されない

**症状**:
```
⚠️ Supabase環境変数が設定されていません。
VITE_SUPABASE_URL: 未設定
VITE_SUPABASE_ANON_KEY: 未設定
Uncaught Error: supabaseUrl is required.
```

**原因**: Vercelで環境変数を追加しても、既存のデプロイには反映されない

**解決方法**:
1. Vercel Dashboard → Settings → Environment Variables で設定
2. **「Production」にチェックを入れる**（重要）
3. 手動で再デプロイ（Deployments → Redeploy）、またはGitHubにプッシュ

**所要時間**: 30分（トラブルシューティング含む）

---

#### 問題2: /loginルートが404エラー

**症状**:
```
GET https://tts-xxx.vercel.app/login 404 (Not Found)
```

**原因**: React RouterのSPAルーティング設定がVercelに反映されていない

**解決方法**:
1. `frontend/vercel.json` を作成
2. すべてのルートを `/index.html` にrewrite
3. GitHubにプッシュして再デプロイ

**所要時間**: 15分

---

#### 問題3: Google OAuth認証後にlocalhostへリダイレクト

**症状**:
```
このサイトにアクセスできません
localhost で接続が拒否されました。
```

**原因**: SupabaseのSite URLが `http://localhost:5173` のまま

**解決方法**:
1. Supabase Dashboard → Authentication → URL Configuration
2. Site URLを `https://tts-app-ycaz.vercel.app` に変更
3. Redirect URLsに `https://tts-app-ycaz.vercel.app/**` を追加

**所要時間**: 10分

---

### 次セッションへの引き継ぎ事項

#### 🎯 デプロイ完了！

**本番環境URL**: https://tts-app-ycaz.vercel.app

**実装された機能**:
- ✅ Google OAuth認証（Supabase）
- ✅ 音声キャッシュ（Supabase Storage + Database）
- ✅ 学習記録・ブックマーク機能（Supabase Database）
- ✅ ブックマークから音声再生
- ✅ OpenAI TTS APIコスト削減（50〜96%）

#### すぐに着手できるタスク（今後の拡張）

現時点で**全ての計画タスクが完了**しました。今後のタスクは以下の通り：

1. **🟢 生徒フィードバックの収集**（次のステップ）
   - 高校生に本番URLを共有
   - 使用感、バグ、改善点のフィードバック収集
   - 所要時間: 1〜2週間

2. **🟢 フィードバックに基づく改善**
   - UI/UXの改善
   - バグ修正
   - 新機能の検討

3. **🔵 オプション機能（低優先度）**
   - IndexedDBキャッシュ実装
   - フロントエンドテスト実装
   - CI/CD設定

#### 注意事項

- **⚠️ Supabase無料枠制限**: 500MB DB、1GB Storage（超過前にProプラン検討）
- **⚠️ OpenAI API使用量監視**: 音声キャッシュでコスト削減されているが、定期的に確認
- **⚠️ Railway無料クレジット**: 初回$5クレジット（使用状況を監視）

#### 参考ドキュメント

**本番環境**:
- フロントエンド: https://tts-app-ycaz.vercel.app
- バックエンド: https://tts-app-production.up.railway.app
- Supabase: https://supabase.com/dashboard

**ドキュメント**:
- `docs/DEPLOYMENT.md` - デプロイ手順
- `docs/SUPABASE_SETUP_GUIDE.md` - Supabaseセットアップ手順
- `docs/USER_GUIDE.md` - 生徒向け使用ガイド

---

### 成果物リスト

#### 新規作成ファイル
- [x] `frontend/vercel.json` - Vercel SPAルーティング設定（8行）

#### 更新ファイル
- [x] `docs/sessions/TODO.md` - セッション#30完了記録
- [x] Railway環境変数（SUPABASE_URL, SUPABASE_SERVICE_KEY）
- [x] Vercel環境変数（VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY）
- [x] Supabase URL Configuration（Site URL, Redirect URLs）

#### Git commits
- [x] `df29447` - fix: Vercelルーティング設定追加（SPA対応）
- [x] リモートへプッシュ完了 ✅

---

### 統計情報
- 作業時間: 約1.5時間
- 完了タスク: 9個
  1. Railway環境変数設定
  2. Vercel環境変数設定
  3. vercel.json作成
  4. Supabase URL Configuration設定
  5. Google OAuth認証テスト
  6. 音声キャッシュテスト
  7. ブックマーク音声再生テスト
  8. TODO.md更新
  9. Gitコミット＆プッシュ
- コミット数: 1
- 変更ファイル: 1（新規）
- 追加行数: 8行
- 環境変数設定: 4個（Railway: 2, Vercel: 2）
- E2Eテスト: 3項目すべて成功

---

## セッション #29 - 2025-11-08（✅ 完了）

### 実施内容

このセッションでは、**Supabase移行 フェーズ3: テスト＋UI実装＋バグ修正**を完了しました。バックエンドの環境変数設定を修正し、フロントエンドのAPI層をSupabase対応に更新。移行ツールUIを実装し、ブックマーク音声再生の重大なバグを修正しました。全機能のテストを完了し、ローカル環境での動作を確認しました。

#### 1. バックエンド設定修正（25分）

**問題**: Supabase環境変数が認識されず、「Supabaseが設定されていません」エラーが発生

**解決**:
- `backend/app/core/config.py`: Settings classに3つのフィールド追加
  - `supabase_url: str = ""`
  - `supabase_service_key: str = ""`
  - `supabase_anon_key: str = ""`
- `backend/app/core/supabase.py`: os.getenv() → settings参照に変更
- `backend/app/core/supabase.py`: Unicode絵文字 → ASCII文字（"✅" → "[OK]"）

**技術的決定**:
- **Pydantic Settings使用**: .envファイルの自動読み込み、型安全性
- **os.getenv()問題**: 手動で.envを読み込まないと環境変数が取得できない

**変更ファイル**: `backend/app/core/config.py`, `backend/app/core/supabase.py`

#### 2. フロントエンドAPI修正（1時間）

**実装内容**:
- `frontend/src/services/api/tts.ts`: performTTSSeparated()を修正
  - Supabase対応: `audio_urls`（URL配列）から音声をフェッチ
  - 後方互換性: `audio_segments`（base64）もサポート
  - `from_cache`フラグ処理追加
  - デュアルモード対応（Supabase有効/無効）

**技術的決定**:
- **URL vs base64**: Supabase有効時はStorage URL、無効時はbase64
- **フェッチ処理**: fetch() → Blob生成
- **エラーハンドリング**: 各セグメントのフェッチ失敗を個別に処理

**変更ファイル**: `frontend/src/services/api/tts.ts`

#### 3. 移行ツールUI実装（1時間15分）

**実装内容**:
- `frontend/src/MainPage.tsx`: 移行バナー追加
  - 移行確認ダイアログ（「今すぐ移行する」「後で」ボタン）
  - 進捗表示（materials: X個、bookmarks: Y個、sessions: Z個）
  - 移行完了メッセージ（5秒後自動非表示）
  - エラーハンドリング
- `frontend/src/MainPage.css`: バナースタイル（168行追加）
  - 紫青グラデーション背景
  - スライドダウンアニメーション
  - スピナーアニメーション
- `frontend/src/utils/migration.ts`: onProgressコールバック追加

**技術的決定**:
- **進捗表示**: コールバック関数でリアルタイム更新
- **自動非表示**: 成功時は5秒後に自動でバナーを閉じる
- **却下機能**: 「後で」ボタンでバナーを閉じる（次回起動時に再表示）

**変更ファイル**: `frontend/src/MainPage.tsx`, `frontend/src/MainPage.css`, `frontend/src/utils/migration.ts`

#### 4. ブックマーク音声再生バグ修正（1時間30分）

**問題**: ブックマークから音声再生をクリックしても、AudioPlayerが全く応答しない。テキストが認識されていないように見える。

**原因**:
1. **React状態更新の非同期性**: `setOcrSentences()`直後に`handleGenerateSpeech()`を呼んでも、`ocrSentences`はまだ更新されていない
2. **タイミング問題**: `setCurrentSentenceIndex()`が音声生成の**後**に呼ばれていた
3. **初期インデックス未対応**: `useAudioSegments`が常にindex 0から開始

**解決**:
- `frontend/src/MainPage.tsx`: `handleBookmarkPlay()`を完全リライト
  - `performTTSSeparated()`を直接呼び出し（materialSentencesを引数として渡す）
  - `setCurrentSentenceIndex()`を音声生成の**前**に実行
  - デバッグログ追加（`[Bookmark Play]`プレフィックス）
- `frontend/src/components/features/AudioPlayer/AudioPlayer.tsx`: `externalSentenceIndex` propを追加
- `frontend/src/components/features/AudioPlayer/hooks/useAudioSegments.ts`: externalSentenceIndex対応
  - 初期インデックスを外部から指定可能に
  - useEffectの依存配列に追加

**技術的決定**:
- **直接呼び出し**: 状態更新を待たず、関数に直接値を渡す
- **インデックス指定**: propsで初期インデックスを受け取る設計

**変更ファイル**:
- `frontend/src/MainPage.tsx`
- `frontend/src/components/features/AudioPlayer/AudioPlayer.tsx`
- `frontend/src/components/features/AudioPlayer/hooks/useAudioSegments.ts`

---

### 発生した問題と解決

#### 問題1: Supabase環境変数が認識されない

**症状**: バックエンド起動時に「[WARNING] Supabase environment variables not set」

**原因**: `config.py`のSettingsクラスにSupabase関連フィールドが未定義

**解決方法**:
1. Settings classに3つのフィールド追加
2. デフォルト値を空文字列に設定（Optional）

**所要時間**: 15分

#### 問題2: Unicode絵文字エンコードエラー

**症状**: `UnicodeEncodeError: 'cp932' codec can't encode character '\u2705'`

**原因**: Windows コンソール（cp932）が絵文字をサポートしていない

**解決方法**: "✅" → "[OK]"、"⚠️" → "[WARNING]"に変更

**所要時間**: 10分

#### 問題3: ブックマーク再生時にプレイヤーが反応しない

**症状**:
- 「🔊 この文から音声再生」ボタンをクリックしても何も起こらない
- AudioPlayerが表示されない
- バックエンドログで`/api/tts`（通常TTS）が呼ばれていた（正しくは`/api/tts-with-timings-separated`）

**原因**:
1. `handleGenerateSpeech()`が内部で`ocrSentences`状態を参照するが、`setOcrSentences()`直後では未更新
2. `setCurrentSentenceIndex()`が音声生成の後に実行されていた

**解決方法**:
1. `handleBookmarkPlay()`を完全リライト
2. `performTTSSeparated()`を直接呼び出し、`materialSentences`を引数として渡す
3. `setCurrentSentenceIndex()`を音声生成の**前**に実行
4. `externalSentenceIndex` propを`useAudioSegments`に追加

**所要時間**: 1時間30分

---

### テスト結果

#### ✅ Google OAuth認証テスト（5分）
- Googleアカウントでログイン成功
- ログアウト機能正常
- ブラウザコンソールエラーなし

#### ✅ 音声キャッシュテスト（10分）
- 初回生成: キャッシュミス（`from_cache=False`）
- 2回目: キャッシュヒット（`from_cache=True`）
- Supabase Storageに保存確認
- バックエンドログ確認: `[TTS] Returning audio URLs (from_cache=True)`

#### ✅ 学習記録・ブックマーク機能テスト（15分）
- 学習セッション記録: 正常保存
- ブックマーク作成: ☆マークで追加成功
- ブックマークから再生: 指定文から開始成功
- バックエンドログ確認: `/api/tts-with-timings-separated`が正しく呼ばれている

---

### 次セッションへの引き継ぎ事項

#### 🎯 すぐに着手できるタスク

TODO.mdによると、以下のタスクが最優先です：

1. **🔴 Railway環境変数設定**（15分）
   - SUPABASE_URL, SUPABASE_SERVICE_KEY を追加
   - Railwayダッシュボードで設定

2. **🔴 Vercel環境変数設定**（15分）
   - VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY を追加
   - Vercelダッシュボードで設定

3. **🔴 本番環境E2Eテスト**（30分）
   - Google OAuth認証テスト
   - 音声キャッシュヒット/ミステスト
   - ブックマーク音声再生テスト

#### 注意事項

- **Supabase URL**: 本番環境でも同じSupabaseプロジェクトを使用
- **CORS設定**: 本番URLがCORS_ORIGINSに含まれているか確認
- **キャッシュテスト**: 同じテキストで2回TTS生成して、2回目がキャッシュヒットすることを確認

---

### 成果物リスト

#### 更新ファイル
- [x] `backend/app/core/config.py` - Supabase環境変数フィールド追加
- [x] `backend/app/core/supabase.py` - os.getenv() → settings参照、Unicode対応
- [x] `frontend/src/services/api/tts.ts` - performTTSSeparated() audio_urls対応
- [x] `frontend/src/utils/migration.ts` - onProgress コールバック追加
- [x] `frontend/src/MainPage.tsx` - 移行バナー追加、handleBookmarkPlay()リライト
- [x] `frontend/src/MainPage.css` - 移行バナースタイル（168行追加）
- [x] `frontend/src/components/features/AudioPlayer/AudioPlayer.tsx` - externalSentenceIndex prop追加
- [x] `frontend/src/components/features/AudioPlayer/hooks/useAudioSegments.ts` - 初期インデックス指定対応

#### Git commits
- [x] `d3acb49` - セッション#29: Supabase移行 フェーズ3完了 - テスト＋UI実装＋バグ修正
- [x] `a9cc33c` - docs: TODO.md更新 - セッション#29完了記録

---

### 統計情報
- 作業時間: 約3時間
- 完了タスク: 9個
  1. performTTSSeparated() 修正（audio_urls対応）
  2. 移行ツールUI実装（移行バナー追加）
  3. TypeScriptコンパイルチェック
  4. Google OAuth認証テスト
  5. 音声キャッシュ機能テスト
  6. 学習記録機能テスト
  7. ブックマーク音声再生バグ修正
  8. Gitコミット作成
  9. TODO.md更新（フェーズ3完了チェック）
- コミット数: 2
- 変更ファイル: 8
- 追加行数: 約442行
- 削除行数: 約44行

---

## セッション #28 - 2025-11-08（✅ 完了）

### 実施内容

このセッションでは、**Supabase移行 フェーズ2: 認証UI実装＋音声キャッシュサービス**を完了しました。フロントエンドに認証機能（Login/SignUp/ResetPassword）を実装し、React Routerで保護されたルート機能を追加。バックエンドには音声キャッシュサービスを実装し、OpenAI TTS APIコストを50-96%削減する仕組みを構築しました。

#### 1. 認証UI実装（1-2時間）

**実装内容**:
- `frontend/src/pages/Login.tsx` 作成（メール/Google/GitHub認証対応）
- `frontend/src/pages/SignUp.tsx` 作成（パスワード確認、確認メール送信）
- `frontend/src/pages/ResetPassword.tsx` 作成（パスワードリセットフロー）
- `frontend/src/pages/Auth.css` 作成（認証ページ共通スタイル、紫青グラデーション）
- `frontend/src/pages/index.ts` 作成（エクスポート管理）

**技術的決定**:
- Google/GitHub OAuth対応（`signInWithOAuth`）
- エラーハンドリング（詳細なエラーメッセージ表示）
- 確認メール送信フロー（`emailRedirectTo`）

#### 2. ProtectedRoute＋React Router統合（1時間）

**実装内容**:
- `frontend/src/components/ProtectedRoute.tsx` 作成（未ログイン時にログインページへリダイレクト）
- `frontend/src/hooks/useAuth.ts` 作成（認証状態監視、ログアウト機能）
- `frontend/src/App.tsx` リファクタリング（BrowserRouterでルーティング統合）
- `frontend/src/MainPage.tsx` 作成（既存App.tsxをリネーム、ログアウトボタン追加）
- React Router導入（`react-router-dom@6.22.0`）

**技術的決定**:
- **React Router v6採用**: クライアントサイドルーティング、ProtectedRoute実装
- **認証状態監視**: `supabase.auth.onAuthStateChange`でリアルタイム更新
- **ルート設計**:
  - `/login` - ログインページ
  - `/signup` - 新規登録ページ
  - `/reset-password` - パスワードリセット
  - `/` - メインアプリ（保護されたルート）
  - `*` - 未定義ルートはログインページへリダイレクト

**変更ファイル**:
- `frontend/package.json` - React Router依存関係追加
- `frontend/src/main.tsx` - App.cssインポート追加

#### 3. localStorage移行ツール実装（1時間）

**実装内容**:
- `frontend/src/utils/migration.ts` 作成（localStorage → Supabase自動移行）
- `needsMigration()` 実装（移行が必要かチェック、移行完了フラグ管理）
- `migrateToSupabase()` 実装（materials, bookmarks, learning_sessions移行）

**移行フロー**:
1. ユーザー認証チェック
2. localStorageからLearningData取得
3. ブックマークから教材を抽出（materialId → material情報）
4. 教材をSupabaseに保存（materials テーブル）
5. ブックマークをSupabaseに保存（bookmarks テーブル、外部キー参照）
6. 学習セッションをSupabaseに保存（learning_sessions テーブル）
7. 移行完了フラグを設定（`migration_completed: true`）

**技術的決定**:
- **段階的移行**: localStorage版を保持（バックアップ）
- **移行完了フラグ**: 重複移行を防ぐ
- **エラーハンドリング**: 個別の保存エラーを記録、全体は継続

#### 4. バックエンド音声キャッシュサービス実装（2-3時間）

**実装内容**:
- `backend/app/services/audio_cache_service.py` 作成（全ユーザー共有でコスト削減）
- `generate_cache_key()` 実装（SHA-256ハッシュ生成: text + sentences + voice + format）
- `get_cached_audio()` 実装（キャッシュ検索、access_count更新、last_accessed_at更新）
- `save_to_cache()` 実装（Supabase Storageアップロード、audio_cacheテーブル保存）
- `generate_or_get_cached()` 実装（キャッシュ検索→ヒット時返却、ミス時生成→保存）

**キャッシュ機構**:
- **キャッシュキー**: SHA-256ハッシュ（64文字）
- **ストレージ**: Supabase Storage `audio-files` バケット
- **ファイル命名**: `cache/{hash}_segment_{i}.{format}`
- **公開URL**: `getPublicUrl()`で取得、1年間キャッシュ（`max-age=31536000`）
- **データベース**: audio_cacheテーブルに保存（segment_urls, durations, sentences, total_duration等）

**コスト削減効果**:
- キャッシュヒット率50%: $7.50 → $3.75（50%削減）
- キャッシュヒット率75%: $7.50 → $1.88（75%削減）
- キャッシュヒット率90%: $7.50 → $0.75（90%削減）

#### 5. TTSエンドポイント修正（1時間）

**実装内容**:
- `backend/app/api/routes/tts.py` 修正（AudioCacheServiceインポート）
- `/tts-with-timings-separated` エンドポイント修正
  - キャッシュヒット時: Supabase Storage URLを返却（`audio_urls`）
  - キャッシュミス時: OpenAI TTS生成→Supabase保存→URL返却
  - Supabase未設定時: 従来のbase64 blobsを返却（後方互換性）

**レスポンス形式**:
```json
// Supabase有効時
{
  "audio_urls": ["https://..."],
  "durations": [2.5, 3.1, ...],
  "total_duration": 10.3,
  "from_cache": true,
  "format": "mp3"
}

// Supabase無効時（後方互換性）
{
  "audio_segments": [
    {"audio_data": "base64...", "duration": 2.5},
    ...
  ],
  "total_duration": 10.3,
  "format": "mp3"
}
```

---

### 技術的決定事項

#### 決定1: React Router v6採用

**理由**:
- クライアントサイドルーティング（SPA体験）
- ProtectedRoute実装が容易
- 認証フロー統合（未ログイン時のリダイレクト）

**代替案**:
- Next.js: SSR対応だがオーバースペック、既存Vite構成を変更する必要あり
- 手動実装: ルーティングを自前で実装するのは保守性が低い

#### 決定2: 音声キャッシュ機構（全ユーザー共有）

**理由**:
- OpenAI TTS APIコストを50-96%削減
- ユーザー間で音声を共有（同じテキストは1回だけ生成）
- レスポンス速度向上（キャッシュヒット時は即座に返却）
- Supabase Storage無料枠（1GB）を活用

**実装**:
- SHA-256ハッシュでキャッシュキー生成（text + sentences + voice + format）
- audio_cache テーブルで管理（RLS無効: 全ユーザー閲覧可能、service_roleのみ書き込み）
- Supabase Storage に音声ファイル保存（公開URL）
- access_count で人気コンテンツを追跡

#### 決定3: 段階的移行戦略

**理由**:
- localStorage版を保持（バックアップ、Supabase障害時のフォールバック）
- 後方互換性維持（Supabase未設定時も動作）
- ユーザーデータの安全性（移行失敗時もデータ損失なし）

**実装**:
- 移行完了フラグ（`migration_completed`）で重複移行を防ぐ
- Supabase未設定時は従来のlocalStorage使用
- TTSエンドポイントはSupabase有効/無効の両方に対応

---

### 次セッションへの引き継ぎ事項

#### すぐに着手できるタスク

TODO.mdによると、以下のタスクが残っています：

1. **🎯 ローカル環境テスト**（最優先、1-2時間）
   - npm run dev でフロントエンド起動
   - python -m uvicorn app.main:app --reload でバックエンド起動
   - 認証フロー確認（サインアップ→ログイン→メインアプリ）
   - 音声キャッシュ動作確認（キャッシュヒット/ミス）
   - エラーハンドリング確認

2. **🔧 フロントエンドAPI修正**（1時間）
   - `performTTSSeparated()`を修正（audio_urls対応）
   - キャッシュヒット時の処理追加（URLから音声ロード）
   - Supabase未設定時の後方互換性確認

3. **📋 移行ツールUIの実装**（1時間）
   - MainPage.tsx に移行バナー追加
   - ユーザーに「データ移行しますか？」確認ダイアログ
   - 移行進捗表示（materials: X個、bookmarks: Y個、sessions: Z個）
   - 移行完了メッセージ

4. **🚀 デプロイ更新**（30分）
   - Railway＋Vercelへの最新コードデプロイ
   - 環境変数確認（Supabase API Keys）
   - 本番環境でのE2Eテスト

#### 注意事項

- **⚠️ Supabase環境変数**: フロント（VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY）とバック（SUPABASE_URL, SUPABASE_SERVICE_KEY）の両方を設定
- **⚠️ service_role キー**: 絶対にGitHubにコミットしない、公開しない（バックエンド専用）
- **⚠️ 音声キャッシュテスト**: 同じテキストで2回TTS生成→2回目はキャッシュヒットを確認
- **⚠️ 移行ツール**: 本番環境では一度だけ実行（重複移行防止）

#### 参考ドキュメント

**次回セッションで参照すべきファイル**:
- `docs/SUPABASE_SETUP_GUIDE.md` - Supabaseセットアップ手順
- `frontend/src/services/api/tts.ts` - TTS API関数（修正対象）
- `backend/app/services/audio_cache_service.py` - キャッシュサービス実装
- `database/schema.sql` - audio_cacheテーブル構造

---

### 成果物リスト

#### 新規作成ファイル
- [x] `frontend/src/pages/Login.tsx` - ログインページ（メール/OAuth認証）
- [x] `frontend/src/pages/SignUp.tsx` - 新規登録ページ（パスワード確認）
- [x] `frontend/src/pages/ResetPassword.tsx` - パスワードリセットページ
- [x] `frontend/src/pages/Auth.css` - 認証ページ共通スタイル
- [x] `frontend/src/pages/index.ts` - エクスポート管理
- [x] `frontend/src/components/ProtectedRoute.tsx` - 保護されたルート
- [x] `frontend/src/hooks/useAuth.ts` - 認証フック
- [x] `frontend/src/MainPage.tsx` - メインアプリページ（旧App.tsx）
- [x] `frontend/src/utils/migration.ts` - localStorage移行ツール
- [x] `backend/app/services/audio_cache_service.py` - 音声キャッシュサービス

#### 更新ファイル
- [x] `frontend/package.json` - React Router依存関係追加
- [x] `frontend/package-lock.json` - npm install結果
- [x] `frontend/src/App.tsx` - ルーティング統合（BrowserRouter）
- [x] `frontend/src/App.css` - ローディングスピナースタイル
- [x] `frontend/src/MainPage.css` - 旧App.cssをリネーム
- [x] `frontend/src/main.tsx` - App.cssインポート追加
- [x] `backend/app/api/routes/tts.py` - AudioCacheService統合

#### Git commits
- [x] `c8e1cac` - セッション#28: Supabase移行 フェーズ2 - 認証UI＋音声キャッシュ実装
- [x] リモートへプッシュ完了 ✅

---

### 統計情報
- 作業時間: 約3-4時間
- 完了タスク: 7個（認証UI、ProtectedRoute、React Router、移行ツール、音声キャッシュ、TTSエンドポイント、npm install）
- 新規作成ファイル: 10個
- 更新ファイル: 7個
- 総行数: 約1,500行
- コミット数: 1
- TypeScriptコンパイル: ✅ 成功
- npm install: ✅ 成功
- Git push: ✅ 成功

---

## セッション #27 - 2025-11-08（✅ 完了）

### 実施内容

このセッションでは、**Supabase移行 フェーズ1: 基盤構築**を完了しました。データベーススキーマ、RLSポリシー、認証統合、セットアップガイドを作成し、ユーザーがSupabaseプロジェクトを作成できる準備が整いました。

#### 1. データベーススキーマ作成

**ファイル**: `database/schema.sql` (約200行)

**実装内容**:
- `audio_cache` テーブル（音声キャッシュ、全ユーザー共有）
  - SHA-256ハッシュでキャッシュキー管理
  - Supabase Storage URLを保存
  - access_count で再利用回数追跡
- `materials` テーブル（教材、ユーザーごと）
  - OCR結果、手動入力等の教材を保存
  - audio_cache への参照（同じテキストは音声共有）
- `bookmarks` テーブル（ブックマーク、ユーザーごと）
  - 習得度管理（1-5段階）、メモ機能
  - 練習回数、最終練習日記録
- `learning_sessions` テーブル（学習セッション、ユーザーごと）
  - セッション開始・終了時刻、再生回数、総学習時間
  - 文ごとの練習回数（JSON）
- `vocabulary` テーブル（単語帳、将来拡張）
  - CEFR判定、頻度ランキング、単語帳掲載情報
  - 間隔反復学習（次回復習日）

**技術的決定**: PostgreSQLのJSONB型を使用してスキーマの柔軟性を確保

#### 2. Row Level Security (RLS) ポリシー設定

**ファイル**: `database/rls_policies.sql` (約150行)

**実装内容**:
- **materials, bookmarks, learning_sessions, vocabulary**: ユーザーは自分のデータのみアクセス可能
- **audio_cache**: 全認証済みユーザーが閲覧可能、バックエンド（service_role）のみ書き込み

**セキュリティ効果**: マルチユーザー対応、データ分離、不正アクセス防止

#### 3. Supabaseセットアップガイド作成

**ファイル**: `docs/SUPABASE_SETUP_GUIDE.md` (約500行)

**内容**:
- ステップバイステップの詳細手順（所要時間: 約30分）
- プロジェクト作成、データベーススキーマ作成、RLS設定
- Storageバケット作成、API Keys取得、環境変数設定
- トラブルシューティング（3つの典型的な問題と解決方法）

#### 4. フロントエンド Supabaseクライアント統合

**ファイル**: `frontend/src/services/supabase/supabaseClient.ts` (約250行)

**実装機能**:
- 認証: サインアップ、ログイン、ログアウト、Google/GitHub認証
- パスワード管理: リセット、更新
- 認証状態監視: onAuthStateChange
- データベースアクセス: getTable() ヘルパー関数
- ストレージアクセス: getStorageBucket() ヘルパー関数
- ユーティリティ: isSupabaseConfigured(), getAuthToken()

**依存関係追加**: `@supabase/supabase-js: ^2.39.0` (frontend/package.json)

#### 5. バックエンド Supabase統合

**ファイル**: `backend/app/core/supabase.py` (約200行)

**実装機能**:
- JWTトークン検証: get_current_user() ミドルウェア
- オプション認証: get_optional_user() （認証なしでもアクセス可能なエンドポイント用）
- データベースアクセス: get_supabase_admin() （RLS無視）、get_supabase_anon() （RLS適用）
- ストレージアクセス: get_storage_bucket()
- ユーティリティ: is_supabase_configured()

**依存関係追加**: `supabase==2.9.0` (backend/requirements.txt)

#### 6. 環境変数テンプレート更新

**ファイル**: `frontend/.env.example`, `backend/.env.example`

**追加環境変数**:
- `VITE_SUPABASE_URL` (フロントエンド)
- `VITE_SUPABASE_ANON_KEY` (フロントエンド)
- `SUPABASE_URL` (バックエンド)
- `SUPABASE_SERVICE_KEY` (バックエンド、⚠️公開禁止)
- `SUPABASE_ANON_KEY` (バックエンド)

---

### 技術的決定事項

#### 決定1: Supabaseを採用（Firebase、MongoDB Atlasではなく）

**理由**:
- PostgreSQL（リレーショナルDB、複雑なクエリ対応）
- オープンソース（ベンダーロックイン回避）
- 認証・ストレージ・リアルタイム統合
- コスパ最高（無料枠: 500MB DB、1GB Storage）
- Row Level Security（セキュリティ強固）

**代替案**:
- Firebase: NoSQL、JOIN弱い、コスト高
- MongoDB Atlas: セットアップ複雑、学習コスト高

#### 決定2: 音声キャッシュ機構の導入（全ユーザー共有）

**理由**:
- OpenAI TTS APIコストを50-96%削減
- ユーザー間で音声を共有（同じテキストは1回だけ生成）
- レスポンス速度向上（キャッシュヒット時は即座に返却）

**実装**:
- SHA-256ハッシュでキャッシュキー生成（テキスト+音声設定）
- audio_cache テーブルで管理
- Supabase Storage に音声ファイル保存
- access_count で人気コンテンツを追跡

**コスト削減効果**:
- キャッシュヒット率50%: $7.50 → $3.75（50%削減）
- キャッシュヒット率75%: $7.50 → $1.88（75%削減）

#### 決定3: Row Level Security（RLS）の適用

**理由**:
- マルチユーザー対応
- データの安全性保証（ユーザーは自分のデータのみアクセス可能）
- PostgreSQL標準機能（追加実装不要）

**実装**:
- materials, bookmarks, learning_sessions, vocabulary: ユーザーごとに分離
- audio_cache: 全ユーザー共有（バックエンドのみ書き込み）

---

### 次セッションへの引き継ぎ事項

#### すぐに着手できるタスク

**🎯 ユーザーが実施する作業**（所要時間: 約30分）

1. **Supabaseプロジェクト作成**（約10分）
   - https://supabase.com でアカウント作成
   - 新規プロジェクト作成（Name: `tts-learning-app`, Region: Tokyo）
   - Database Password を設定（必ずメモ）

2. **データベーススキーマ作成**（約5分）
   - Supabase SQL Editorで `database/schema.sql` を実行
   - `database/rls_policies.sql` を実行

3. **Storageバケット作成**（約3分）
   - Storage → Create bucket: `audio-files` (Public)

4. **API Keys取得**（約2分）
   - Settings → API で以下をコピー:
     - Project URL
     - anon public key
     - service_role key（⚠️絶対に公開しない）

5. **環境変数設定**（約5分）
   - `frontend/.env` と `backend/.env` を作成
   - API Keys を設定

6. **依存関係インストール**（約2分）
   - フロントエンド: `cd frontend && npm install`
   - バックエンド: `cd backend && pip install -r requirements.txt`

**📋 次回セッションで実施する作業**（所要時間: 3-4時間）

1. **認証UIの実装**（1-2時間）
   - ログイン・サインアップ画面
   - パスワードリセット機能
   - 保護されたルート（ProtectedRoute）

2. **localStorage → Supabase 移行ツール**（1時間）
   - 既存の学習データ・ブックマークを移行
   - 移行完了フラグ管理

3. **音声キャッシュサービス実装**（2-3時間）
   - バックエンドで音声キャッシュ検索・保存
   - Supabase Storage統合
   - コスト削減機構

#### 注意事項

- **service_role キー**: ⚠️絶対にGitHubにコミットしない、公開しない
- **無料枠制限**: 500MB DB、1GB Storage（超過前にProプラン検討）
- **段階的移行**: localStorageを一定期間保持（バックアップ）
- **データ移行ツール**: 次回セッションで実装（自動移行スクリプト）

#### 参考ドキュメント

**次回セッションで参照すべきファイル**:
- `docs/SUPABASE_SETUP_GUIDE.md` - セットアップ手順
- `docs/FUTURE_EXPANSION_PLAN.md` - Supabase移行計画全体像
- `database/README.md` - データベースセットアップ概要
- `frontend/src/services/supabase/supabaseClient.ts` - Supabase認証API
- `backend/app/core/supabase.py` - Supabase認証ミドルウェア

---

### 成果物リスト

#### 新規作成ファイル
- [x] `database/schema.sql` - データベーススキーマ（6テーブル、約200行）
- [x] `database/rls_policies.sql` - Row Level Securityポリシー（約150行）
- [x] `database/README.md` - データベースセットアップガイド（約300行）
- [x] `docs/SUPABASE_SETUP_GUIDE.md` - 詳細なセットアップ手順（約500行）
- [x] `frontend/src/services/supabase/supabaseClient.ts` - Supabaseクライアント（約250行）
- [x] `frontend/src/services/supabase/index.ts` - エクスポートファイル（約20行）
- [x] `backend/app/core/supabase.py` - Supabase統合（約200行）

#### 更新ファイル
- [x] `frontend/.env.example` - Supabase環境変数追加（3行追加）
- [x] `backend/.env.example` - Supabase環境変数追加（4行追加）
- [x] `frontend/package.json` - @supabase/supabase-js 追加
- [x] `backend/requirements.txt` - supabase==2.9.0 追加

#### Git commits
- [ ] セッション#27の完全実装コミット作成（次のステップで実施）

---

### 統計情報
- 作業時間: 約2時間
- 完了タスク: 7個（スキーマ、RLS、ガイド、フロント/バック統合、環境変数）
- 作成ファイル: 7個
- 更新ファイル: 4個
- 総行数: 約1,500行

---

