# データベースセットアップ

このディレクトリには、Supabaseデータベースのセットアップに必要なSQLファイルが含まれています。

## 📁 ファイル構成

```
database/
├── README.md           # このファイル
├── schema.sql          # データベーススキーマ（テーブル定義）
└── rls_policies.sql    # Row Level Security ポリシー
```

## 🚀 セットアップ手順

### 1. Supabaseプロジェクト作成

詳細な手順は `docs/SUPABASE_SETUP_GUIDE.md` を参照してください。

1. https://supabase.com でアカウント作成
2. 新規プロジェクト作成
3. API Keys取得

### 2. データベーススキーマ作成

1. Supabaseダッシュボードで **「SQL Editor」** を開く
2. **「+ New query」** をクリック
3. `schema.sql` の内容をコピー&ペースト
4. **「Run」** をクリック

### 3. RLSポリシー設定

1. SQL Editorで **「+ New query」** をクリック
2. `rls_policies.sql` の内容をコピー&ペースト
3. **「Run」** をクリック

### 4. テーブル確認

**「Table Editor」** で以下のテーブルが作成されていることを確認:

- ✅ `audio_cache` - 音声キャッシュ（全ユーザー共有）
- ✅ `materials` - 教材（ユーザーごと）
- ✅ `bookmarks` - ブックマーク（ユーザーごと）
- ✅ `learning_sessions` - 学習セッション（ユーザーごと）
- ✅ `vocabulary` - 単語帳（ユーザーごと、将来拡張）

## 📊 テーブル関係図

```
auth.users (Supabase Auth)
    ↓
    ├── materials (教材)
    │    ├── bookmarks (ブックマーク)
    │    ├── learning_sessions (学習セッション)
    │    └── vocabulary (単語帳)
    │
    └── audio_cache (音声キャッシュ、全ユーザー共有)
```

## 🔒 セキュリティ

### Row Level Security (RLS)

すべてのテーブルでRLSが有効化されています:

- **materials, bookmarks, learning_sessions, vocabulary**
  - ユーザーは自分のデータのみアクセス可能
  - 他のユーザーのデータは閲覧・編集不可

- **audio_cache**
  - 全認証済みユーザーが閲覧可能（音声キャッシュは共有）
  - 挿入・更新・削除はバックエンド（service_role）のみ

## 📝 注意事項

### データベースパスワード

Supabaseプロジェクト作成時に設定したデータベースパスワードを必ずメモしてください。紛失した場合、再発行が必要です。

### サービスロールキー

`service_role` キーは**絶対に公開しないでください**。このキーはRLS制限を無視できる強力なキーです。

- ✅ バックエンド（FastAPI）の `.env` ファイルのみ
- ❌ フロントエンド、GitHub、公開サーバー

## 🔄 マイグレーション

スキーマ変更時は以下の手順で実施:

1. 新しいSQLファイルを作成（例: `migration_001.sql`）
2. Supabase SQL Editorで実行
3. Gitにコミット

## 🆘 トラブルシューティング

### エラー: `relation "auth.users" does not exist`

**原因**: Supabase Authが有効化されていない

**解決方法**:
1. **「Authentication」** → **「Settings」** をクリック
2. **「Enable authentication」** をオンにする
3. SQLを再実行

### エラー: `permission denied for table xxx`

**原因**: RLSポリシーが設定されていない、または不正

**解決方法**:
1. `rls_policies.sql` を再実行
2. **「Authentication」** → **「Policies」** でポリシーを確認

### テーブルが表示されない

**原因**: SQLの実行に失敗している

**解決方法**:
1. SQL Editorでエラーメッセージを確認
2. `schema.sql` を再実行
3. ブラウザをリロード

## 📚 参考リンク

- [Supabase公式ドキュメント](https://supabase.com/docs)
- [PostgreSQL公式ドキュメント](https://www.postgresql.org/docs/)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**セットアップに関する質問があれば、次回セッションで対応します。**
