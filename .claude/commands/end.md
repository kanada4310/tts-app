---
description: セッション終了時に作業内容を記録して次回に備える
---

# セッション終了プロトコル

このセッションで実施した作業を記録し、次回セッションがスムーズに開始できるように準備します。

## フェーズ1: 作業内容の振り返り

以下の質問に基づいて、このセッションの内容を整理してください:

### 1. 実施した作業
- 何を実装・修正・追加しましたか？
- どのファイルを作成・編集しましたか？
- どの機能が完成しましたか？

### 2. 技術的決定事項
- 重要な設計・実装の判断はありましたか？
- なぜその方法を選択しましたか？
- 代替案はありましたか？

### 3. 発生した問題と解決
- どんな問題・エラーが発生しましたか？
- どのように解決しましたか？
- 解決に時間がかかった理由は？

### 4. 未完了・保留事項
- 完了しなかったタスクは何ですか？
- 保留にした理由は？
- 次回優先すべきタスクは？

### 5. 学んだこと・気づき
- このセッションで得た知見は？
- 改善できる点は？

## フェーズ2: ファイル変更の確認

以下のコマンドで変更内容を確認:

```bash
# 変更されたファイルのリスト
git status

# 変更内容の詳細
git diff
```

変更されたファイルをリストアップし、それぞれの変更理由を記録してください。

## フェーズ3: セッション管理ファイルの更新

### 3.0 SESSION_HISTORY.mdへのアーカイブ（⚠️ 必須 ⚠️）

**⚠️ 重要**: このステップは**必ず実行**してください。HANDOVER.mdには**現在のセッション（#N）のみ**を残し、それ以前のセッションは**全て**SESSION_HISTORY.mdに移動します。

**目的**:
- HANDOVER.mdの肥大化を防ぐ（/start時のトークン消費を削減）
- 最新のセッション情報のみを簡潔に保つ
- 過去のセッションは全てSESSION_HISTORYで参照可能にする

**実行手順**:

#### ステップ1: 現在のセッション番号を確認

```bash
# HANDOVER.mdの最初のセッション番号を確認
grep "^## セッション" docs/sessions/HANDOVER.md | head -1
```

現在のセッションが #N の場合、HANDOVER.mdには #N **のみ**を残します。

#### ステップ2: 前回以前のセッション（#N-1以前）を抽出

以下のPythonスクリプトまたはbashコマンドを使用して自動的にアーカイブ：

**方法A: Bashコマンド（推奨）**

```bash
cd docs/sessions

# 現在のセッション（最初のセッション）の行番号を取得
FIRST_SESSION_LINE=$(grep -n "^## セッション" HANDOVER.md | head -1 | cut -d: -f1)

# 2番目のセッションの行番号を取得（前回セッションの開始位置）
SECOND_SESSION_LINE=$(grep -n "^## セッション" HANDOVER.md | head -2 | tail -1 | cut -d: -f1)

# セッションが2つ以上ある場合のみアーカイブ
if [ -n "$SECOND_SESSION_LINE" ]; then
  # 現在のセッションのみを新しいHANDOVERファイルに保存
  head -n $((SECOND_SESSION_LINE - 1)) HANDOVER.md > HANDOVER_new.md

  # 前回以前のセッションを抽出
  tail -n +$SECOND_SESSION_LINE HANDOVER.md > sessions_to_archive.txt

  # SESSION_HISTORY.mdの目次とヘッダーを読み込み
  head -n 27 SESSION_HISTORY.md > SESSION_HISTORY_header.txt

  # SESSION_HISTORY.mdの既存セッションを取得（28行目以降）
  tail -n +28 SESSION_HISTORY.md > SESSION_HISTORY_body.txt

  # 新しいSESSION_HISTORY.mdを作成
  # 1. ヘッダー（目次は手動で更新）
  cat SESSION_HISTORY_header.txt > SESSION_HISTORY_new.md
  # 2. アーカイブするセッション
  cat sessions_to_archive.txt >> SESSION_HISTORY_new.md
  echo "" >> SESSION_HISTORY_new.md
  # 3. 既存のセッション
  cat SESSION_HISTORY_body.txt >> SESSION_HISTORY_new.md

  # ファイルを置き換え
  mv HANDOVER_new.md HANDOVER.md
  mv SESSION_HISTORY_new.md SESSION_HISTORY.md

  # 一時ファイルを削除
  rm sessions_to_archive.txt SESSION_HISTORY_header.txt SESSION_HISTORY_body.txt

  echo "✅ HANDOVER.mdを整理しました（現在のセッションのみ残存）"
  echo "✅ 前回以前のセッションをSESSION_HISTORY.mdにアーカイブしました"
else
  echo "ℹ️ HANDOVER.mdには現在のセッションのみが含まれています（アーカイブ不要）"
fi
```

**方法B: Pythonスクリプト**

```bash
cd docs/sessions
python -c "
import re

# HANDOVER.mdを読み込み
with open('HANDOVER.md', 'r', encoding='utf-8') as f:
    handover = f.read()

# セッションの開始位置を検索
sessions = list(re.finditer(r'^## セッション', handover, re.MULTILINE))

if len(sessions) <= 1:
    print('ℹ️ HANDOVER.mdには現在のセッションのみが含まれています（アーカイブ不要）')
    exit()

# 現在のセッション（最初のセッション）のみを保持
current_session_end = sessions[1].start()
new_handover = handover[:current_session_end].rstrip() + '\n\n'

# 前回以前のセッションを抽出
old_sessions = handover[current_session_end:]

# SESSION_HISTORY.mdを読み込み
with open('SESSION_HISTORY.md', 'r', encoding='utf-8') as f:
    history = f.read()

# SESSION_HISTORY.mdのヘッダー（目次セクション）を取得
history_lines = history.split('\n')
history_header = '\n'.join(history_lines[:27])  # 目次部分（27行目まで）
history_body = '\n'.join(history_lines[27:])

# 新しいSESSION_HISTORY.mdを作成
# 注意: 目次は手動で更新が必要
new_history = history_header + '\n\n' + old_sessions + '\n' + history_body

# ファイルを書き込み
with open('HANDOVER.md', 'w', encoding='utf-8') as f:
    f.write(new_handover)

with open('SESSION_HISTORY.md', 'w', encoding='utf-8') as f:
    f.write(new_history)

print('✅ HANDOVER.mdを整理しました（現在のセッションのみ残存）')
print('✅ 前回以前のセッションをSESSION_HISTORY.mdにアーカイブしました')
print('⚠️ SESSION_HISTORY.mdの目次を手動で更新してください')
"
```

#### ステップ3: SESSION_HISTORY.mdの目次を更新

アーカイブしたセッションを目次に追加：

```markdown
## 目次
- [セッション #N-1 - YYYY-MM-DD](#セッション-n-1---yyyy-mm-dd)
- [セッション #N-2 - YYYY-MM-DD](#セッション-n-2---yyyy-mm-dd)
...
```

#### ステップ4: 確認

```bash
# HANDOVER.mdに現在のセッションのみが含まれていることを確認
grep "^## セッション" docs/sessions/HANDOVER.md

# SESSION_HISTORY.mdにアーカイブされたセッションが含まれていることを確認
grep "^## セッション" docs/sessions/SESSION_HISTORY.md | head -10
```

**期待される結果**:
- HANDOVER.md: 現在のセッション（#N）のみ
- SESSION_HISTORY.md: 全ての過去のセッション（#N-1, #N-2, ...）

**⚠️ この処理を忘れると**:
- HANDOVER.mdが肥大化し、/start時のトークン消費が増加
- セッション開始時の読み込み時間が長くなる
- GitHubのdiffが見づらくなる

### 3.1 HANDOVER.md の更新

**前提**: ステップ3.0で前回以前のセッションは既にアーカイブ済み。HANDOVER.mdには現在のセッション（#N）の内容を追加します。

`docs/sessions/HANDOVER.md`の先頭（`---`の直後）に以下の形式で新しいセクションを**挿入**:

```markdown
## セッション #N - YYYY-MM-DD（✅ 完了）

### 実施内容

このセッションでは、[セッションの概要を1-2文で記載]を行いました。

#### 1. [作業内容のタイトル]

**問題**: [問題があった場合の説明]

**解決**:
- 実施した具体的な作業
- 作成・編集したファイル
- 実装した機能

**変更ファイル**: `path/to/file.ext`

#### 2. [技術的決定事項のタイトル]

**決定**: [決定内容]

**理由**:
- 選択理由
- 代替案との比較

**効果**: [期待される効果]

---

### 技術的決定事項

#### [重要な決定のタイトル]

**発見**: [発見した事実]

**証拠**:
- 証拠1
- 証拠2

**結論**: [結論]

---

### 発生した問題と解決

#### 問題1: [問題のタイトル]

**症状**: [症状の説明]

**原因**: [原因]

**解決方法**: [解決方法]

**所要時間**: [時間]

---

### 次セッションへの引き継ぎ事項

#### すぐに着手できるタスク

TODO.mdによると、以下のタスクが残っています：

1. **🎯 [タスク1]**（最優先）
   - 詳細
   - 所要時間: X時間

2. **🔧 [タスク2]**
   - 詳細
   - 所要時間: Y時間

#### 注意事項

- **[注意点1]**: 説明
- **[注意点2]**: 説明

---

### 成果物リスト

#### 新規作成ファイル
- [x] `path/to/file1.ext` - 説明
- [x] `path/to/file2.ext` - 説明

#### 更新ファイル
- [x] `path/to/file3.ext` - 変更内容

#### Git commits
- [x] `abc1234` - コミットメッセージ
- [x] リモートへプッシュ完了

---

### 統計情報
- 作業時間: 約X時間
- 完了タスク: N個
- コミット数: M
- [その他の統計]

---
```

**重要**:
- ⚠️ 前回以前のセッションは**記載しない**（既にステップ3.0でアーカイブ済み）
- ✅ HANDOVER.mdには**現在のセッション（#N）のみ**が含まれる状態を維持
- 📝 セッション番号、日付、完了ステータス（✅ 完了）を必ず記載

### 3.2 SUMMARY.md の更新

`docs/sessions/SUMMARY.md`を更新:

1. **進捗率の計算と更新**
   - 完了した項目数をカウント
   - 全体タスク数との比率で進捗率を算出
   - プログレスバーを更新

2. **完了した項目の追加**
   - 該当セクション（バックエンド/フロントエンド/インフラ）に完了項目を追加
   - チェックマーク [x] を付ける

3. **統計情報の更新**
   - セッション数: +1
   - 総開発時間: 累積
   - 完了タスク数: 累積
   - コミット数: 現在の数

### 3.3 TODO.md の更新

`docs/sessions/TODO.md`を更新:

1. **完了タスクのチェック**
   - 完了したタスクに [x] をつける
   - または完全に削除（アーカイブ）

2. **新規タスクの追加**
   - このセッションで判明した新しいタスクを追加
   - 適切な優先度 (🔴🟡🟢🔵) を設定
   - 所要時間を見積もり

3. **優先度の見直し**
   - 次セッションの最優先タスク（🔴）が適切か確認
   - 依存関係に基づいて順序を調整

4. **最終更新日の更新**
   - 先頭の「最終更新: YYYY-MM-DD」を今日の日付に

## フェーズ4: Git コミット（オプション）

セッション中に作業した内容をコミットする場合:

```bash
# 変更をステージング
git add .

# コミット（メッセージはセッション内容を反映）
git commit -m "セッション#X: [作業内容の要約]

- [変更1]
- [変更2]
- [変更3]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# GitHubにプッシュ（オプション）
git push
```

**コミットメッセージのガイドライン:**
- 1行目: セッション番号と作業内容の要約（50文字以内）
- 空行
- 詳細な変更内容（箇条書き）
- 空行
- 署名

## フェーズ5: 次回セッションの準備

### 5.1 次回の最優先タスクを明確化

TODO.mdの🔴マークのタスクが次回すぐに着手できる状態か確認:

- [ ] 必要な情報は揃っているか
- [ ] 依存するタスクは完了しているか
- [ ] 実装方針は明確か

不明点があれば、TODO.mdに「事前確認事項」として記載。

### 5.2 必要なファイルのメモ

次回セッションで必要になりそうなファイルを`docs/sessions/TODO.md`の備考欄に記載:

```markdown
## 📝 備考

**次回セッションで参照すべきファイル:**
- backend/app/api/routes/ocr.py - OCR実装の参考
- docs/API.md - エンドポイント仕様
```

### 5.3 環境の確認

次回セッション前に準備すべき環境をメモ:

```markdown
**次回セッション前の準備:**
- [ ] バックエンドの依存関係をインストール (pip install -r requirements.txt)
- [ ] .envファイルにAPIキーを設定
- [ ] データベースのマイグレーション実行
```

## フェーズ6: セッション統計の記録

`docs/sessions/SUMMARY.md`の最後に統計を追加・更新:

```markdown
## 📊 セッション履歴

| # | 日付 | 作業時間 | 完了タスク | 主な成果 |
|---|------|---------|-----------|---------|
| 1 | 2025-10-20 | 1.5h | 18 | プロジェクト初期化、GitHub連携 |
| 2 | YYYY-MM-DD | Xh | N | [主な成果] |
```

## 完了チェックリスト

セッション終了前に以下を確認:

### ⚠️ 必須タスク
- [ ] **SESSION_HISTORY.mdへのアーカイブ完了**（フェーズ3.0）
  - [ ] HANDOVER.mdに現在のセッション（#N）のみが含まれている
  - [ ] 前回以前のセッション（#N-1以前）がSESSION_HISTORY.mdに移動済み
  - [ ] SESSION_HISTORY.mdの目次が更新されている
- [ ] **HANDOVER.mdに今回のセッション内容を追加**（フェーズ3.1）
- [ ] **TODO.mdの完了タスクをチェック**（フェーズ3.3）
- [ ] **TODO.mdの最終更新日を更新**（フェーズ3.3）

### 推奨タスク
- [ ] SUMMARY.mdの進捗率を更新
- [ ] SUMMARY.mdの完了項目を更新
- [ ] TODO.mdに新規タスクを追加
- [ ] TODO.mdの優先度を見直し
- [ ] 次回の最優先タスクが明確
- [ ] 次回必要なファイル・環境をメモ

### オプション
- [ ] Gitコミット・プッシュ（セッション管理ファイル）

## 最後に

セッション終了メッセージを表示:

```
✅ セッション #X 終了

📊 本日の成果:
- 完了タスク: N個
- 作業時間: Xh
- 進捗: XX% → YY% (+Z%)

🎯 次回セッション:
- 最優先: [TODO.mdの🔴タスク]
- 準備: [必要な準備事項]

お疲れ様でした！次回は /start コマンドで開始してください。
```

## テンプレート例

### セッション記録のテンプレート（参考）

```markdown
## セッション #2 - 2025-10-21

### 実施内容

#### 1. OCRエンドポイントの実装
- `backend/app/api/routes/ocr.py`に画像処理とClaude API連携を実装
- `backend/app/schemas/ocr.py`にOCRRequest/Responseスキーマを定義
- `backend/app/services/claude_service.py`にClaude APIクライアントを実装
- 画像のbase64デコードとバリデーションを追加

**技術的決定**:
- Claude API: Sonnet 4.5を使用（理由: 最新モデル、高精度）
- エラーハンドリング: カスタムOCRErrorクラスを使用
- タイムアウト: 30秒に設定（理由: API仕様に準拠）

#### 2. 画像圧縮機能の実装
- `backend/app/utils/image_processing.py`に圧縮ロジックを実装
- Pillowを使用して長辺2000px、品質85%に自動圧縮
- 対応形式: JPEG, PNG

### 発生した問題と解決

**問題**: Claude APIのレート制限エラー
- 原因: 短時間に大量リクエストを送信
- 解決方法: exponential backoffによるリトライ機構を実装
- 所要時間: 30分

**問題**: base64デコード時のメモリエラー
- 原因: 大きすぎる画像
- 解決方法: 事前にサイズチェックを追加（10MB制限）
- 所要時間: 15分

### 次セッションへの引き継ぎ事項

#### すぐに着手すべきこと
1. TTSエンドポイントの実装（OpenAI API連携）
2. OCRエンドポイントのテスト作成
3. エラーレスポンスの統一化

#### 注意事項
- Claude APIキーは.envファイルで管理（コミット禁止）
- 画像処理は非同期処理を検討（大きいファイル対応）
- レート制限対策のキャッシュ機構を将来的に実装

### 成果物リスト
- [x] backend/app/api/routes/ocr.py - OCRエンドポイント
- [x] backend/app/schemas/ocr.py - Pydanticスキーマ
- [x] backend/app/services/claude_service.py - Claude APIクライアント
- [x] backend/app/utils/image_processing.py - 画像圧縮
- [x] backend/tests/test_ocr.py - 基本的なユニットテスト
```
