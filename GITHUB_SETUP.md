# GitHub セットアップガイド

## ✅ 完了済み

- ✅ Gitリポジトリの初期化
- ✅ .gitignoreの設定
- ✅ 初回コミットの作成 (48ファイル、2023行追加)

## 🚀 GitHubリポジトリの作成とプッシュ

### 方法1: GitHub CLIを使用（推奨）

GitHub CLIがインストールされている場合、最も簡単な方法です。

```bash
# プロジェクトディレクトリに移動
cd "G:\.shortcut-targets-by-id\1VHh7Hw_gsOC0bYuPoFjxD5iyQcHO88vV\合同会社つばめ\07_プログラム\TTS"

# GitHubにログイン（初回のみ）
gh auth login

# リポジトリを作成してプッシュ
gh repo create tts-app --private --source=. --push

# または公開リポジトリの場合
gh repo create tts-app --public --source=. --push
```

### 方法2: GitHubウェブサイトから作成

#### ステップ1: GitHubで新規リポジトリを作成

1. https://github.com にアクセス
2. 右上の「+」→「New repository」をクリック
3. 以下の設定を行う:
   - **Repository name**: `tts-app` (任意の名前)
   - **Description**: OCR and Text-to-Speech PWA Application
   - **Visibility**: Private（または Public）
   - **⚠️ 重要**: "Add a README file"、"Add .gitignore"、"Choose a license" は**チェックしない**
4. 「Create repository」をクリック

#### ステップ2: リモートリポジトリを追加してプッシュ

GitHubでリポジトリを作成すると、以下のようなコマンドが表示されます。
**YOUR_USERNAME**と**YOUR_REPO_NAME**を実際の値に置き換えてください。

```bash
# プロジェクトディレクトリに移動
cd "G:\.shortcut-targets-by-id\1VHh7Hw_gsOC0bYuPoFjxD5iyQcHO88vV\合同会社つばめ\07_プログラム\TTS"

# リモートリポジトリを追加
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# ブランチ名をmainに変更（Gitの新しい標準）
git branch -M main

# プッシュ
git push -u origin main
```

### 方法3: GitHub Desktop（GUI）

1. GitHub Desktop をインストール
2. 「File」→「Add Local Repository」
3. プロジェクトフォルダを選択: `G:\.shortcut-targets-by-id\1VHh7Hw_gsOC0bYuPoFjxD5iyQcHO88vV\合同会社つばめ\07_プログラム\TTS`
4. 「Publish repository」をクリック
5. リポジトリ名と公開/非公開を設定
6. 「Publish Repository」をクリック

## 🔐 認証について

### HTTPS認証（推奨）

GitHubでは、HTTPSを使用する場合、パスワードではなく**Personal Access Token (PAT)** が必要です。

1. https://github.com/settings/tokens にアクセス
2. 「Generate new token」→「Generate new token (classic)」
3. 以下を設定:
   - Note: `TTS App Development`
   - Expiration: 90 days（または任意）
   - Scopes: `repo` にチェック
4. 「Generate token」をクリック
5. 表示されたトークンをコピー（**1度しか表示されません**）
6. `git push` 時にパスワード欄にトークンを入力

### SSH認証（上級者向け）

SSHキーを設定している場合、リモートURLをSSH形式に変更できます。

```bash
git remote set-url origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git
```

## 📋 プッシュ後の確認

プッシュが成功したら、以下を確認してください:

1. GitHubリポジトリページで全ファイルが表示されているか
2. README.mdが正しく表示されているか
3. ブランチが`main`になっているか

## 🔄 今後の開発フロー

```bash
# 作業開始
cd "G:\.shortcut-targets-by-id\1VHh7Hw_gsOC0bYuPoFjxD5iyQcHO88vV\合同会社つばめ\07_プログラム\TTS"

# ファイルを編集...

# 変更を確認
git status
git diff

# 変更をステージング
git add .

# コミット
git commit -m "作業内容の説明"

# GitHubにプッシュ
git push
```

## 🌿 ブランチ戦略（オプション）

将来的に以下のブランチ構成を推奨します:

```
main          # 本番環境用（安定版）
└── develop   # 開発用メインブランチ
    ├── feature/ocr-implementation
    ├── feature/tts-implementation
    └── feature/audio-player
```

ブランチを作成する場合:

```bash
# developブランチ作成
git checkout -b develop

# featureブランチ作成
git checkout -b feature/ocr-implementation
```

## 📞 問題が発生した場合

### "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

### 認証エラー
- Personal Access Tokenを再生成
- `gh auth login` で再認証

### プッシュが拒否された場合
```bash
git pull origin main --rebase
git push origin main
```

## 次のステップ

✅ GitHubリポジトリが作成できたら、以下を実施することをお勧めします:

1. **リポジトリの設定**
   - About セクションに説明を追加
   - Topics を追加 (typescript, react, fastapi, tts, ocr)

2. **GitHub Actions設定**（将来的に）
   - CI/CD パイプライン
   - 自動テスト
   - 自動デプロイ

3. **コラボレーション設定**（必要に応じて）
   - Collaborators 追加
   - Branch protection rules

4. **Issue/Project管理**
   - GitHub Issues でタスク管理
   - GitHub Projects でカンバン
