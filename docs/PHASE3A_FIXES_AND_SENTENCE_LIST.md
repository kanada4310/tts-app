# Phase 3A 修正 + 文リスト機能 実装計画

## 概要

セッション#15で実装したPhase 3A機能に対するユーザーフィードバックを受けて、以下の改善と新機能を実装します。

### 対象機能

1. **Phase 1: シークバー改善** (1-2時間)
   - シークバー高さを速度スライダーと同じに
   - スライド操作でシーク可能に（タップのみ→スライド対応）
   - スライド中に常時ツールチップ表示
   - 文番号表示の修正

2. **Phase 2: 文リスト機能** (2-3時間)
   - 音声生成後、OCRテキストを完全に非表示
   - プレーヤーの下に文リストを表示
   - リストを折り畳み可能に
   - 再生中: 現在文 + 前後3文（計7文）を表示
   - 自動スクロール（トグル可能）
   - 再生していない時: 仮想スクロールで全文閲覧
   - 文クリックでその位置にシーク

### 総実装時間: 3.5-5時間

---

## Phase 1: シークバー改善

### タスク 1.1: シークバー高さを速度スライダーと同じに

**目的**: モバイルでシークバーの高さを44pxにして操作しやすくする

**対象ファイル**: `frontend/src/components/features/AudioPlayer/styles.css`

**変更内容**:
```css
@media (max-width: 768px) {
  /* 現在: 24px → 修正後: 44px */
  .progress-bar {
    height: 44px !important;
    border-radius: 22px;
  }

  .progress-fill {
    height: 44px !important;
    border-radius: 22px;
  }

  /* 文マーカーも高さを合わせる */
  .sentence-marker {
    width: 8px !important;
    height: 44px !important;
    border-radius: 4px;
  }
}
```

**デスクトップ**: 高さ8pxのまま維持（変更なし）

**実装時間**: 15分

**テスト項目**:
- [ ] モバイル表示でシークバーが44px高になっている
- [ ] デスクトップでは8pxのまま
- [ ] 文マーカーが44pxに伸びている

---

### タスク 1.2: スライド操作でシーク可能に

**目的**: タップのみではなく、スライド（ドラッグ）でシーク位置を変更可能に

**対象ファイル**: `frontend/src/components/features/AudioPlayer/AudioPlayer.tsx`

**追加するState**:
```typescript
const [isDragging, setIsDragging] = useState(false)
```

**追加する関数**:
```typescript
// タッチ位置から再生位置を計算する共通ロジック
const calculateSeekPosition = (clientX: number): number => {
  const progressBar = document.querySelector('.progress-bar') as HTMLElement
  if (!progressBar || !audioRef.current) return 0

  const rect = progressBar.getBoundingClientRect()
  const offsetX = clientX - rect.left
  const percentage = Math.max(0, Math.min(1, offsetX / rect.width))
  return percentage * audioRef.current.duration
}

// タッチ開始
const handleTouchStart = (e: React.TouchEvent) => {
  setIsDragging(true)
  const touch = e.touches[0]
  const newTime = calculateSeekPosition(touch.clientX)

  if (audioRef.current) {
    audioRef.current.currentTime = newTime
  }

  updateTooltip(touch.clientX)
}

// タッチ移動（スライド中）
const handleTouchMove = (e: React.TouchEvent) => {
  if (!isDragging) return
  e.preventDefault() // デフォルトのスクロールを防止

  const touch = e.touches[0]
  const newTime = calculateSeekPosition(touch.clientX)

  if (audioRef.current) {
    audioRef.current.currentTime = newTime
  }

  updateTooltip(touch.clientX)
}

// タッチ終了
const handleTouchEnd = () => {
  setIsDragging(false)
  // ツールチップは3秒後に自動で消える（既存ロジック）
}

// ツールチップ更新ロジック
const updateTooltip = (clientX: number) => {
  const progressBar = document.querySelector('.progress-bar') as HTMLElement
  if (!progressBar || !audioRef.current) return

  const rect = progressBar.getBoundingClientRect()
  const offsetX = clientX - rect.left
  const percentage = Math.max(0, Math.min(1, offsetX / rect.width))
  const newTime = percentage * audioRef.current.duration

  // 該当する文を見つけてツールチップに表示
  const sentenceIndex = sentences.findIndex((sentence, i) => {
    const nextSentence = sentences[i + 1]
    return newTime >= sentence.timestamp &&
           (!nextSentence || newTime < nextSentence.timestamp)
  })

  if (sentenceIndex !== -1) {
    setTooltipVisible(true)
    setTooltipPosition(percentage * 100)
    setTooltipText(sentences[sentenceIndex].preview)
  }
}
```

**JSX修正**:
```typescript
<div
  className="progress-bar-container"
  onClick={handleSeek}
  onTouchStart={handleTouchStart}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
>
  {/* 既存のプログレスバーコンテンツ */}
</div>
```

**実装時間**: 30分

**テスト項目**:
- [ ] モバイルでシークバーをスライドすると音声位置が変わる
- [ ] スライド中に音が一瞬再生される（リアルタイムフィードバック）
- [ ] デスクトップのクリック操作は正常に動作
- [ ] スライド中にページがスクロールしない（preventDefault動作確認）

---

### タスク 1.3: スライド中に常時ツールチップ表示

**目的**: スライド中、指の位置にツールチップが常に表示される

**対象ファイル**: `frontend/src/components/features/AudioPlayer/AudioPlayer.tsx`

**変更内容**: タスク1.2の `updateTooltip` 関数で既に実装済み

**追加のState管理**:
```typescript
// isDragging が true の間はツールチップを強制表示
useEffect(() => {
  if (isDragging) {
    setTooltipVisible(true)
  }
}, [isDragging])
```

**修正（タスク1.2の handleTouchEnd）**:
```typescript
const handleTouchEnd = () => {
  setIsDragging(false)

  // 3秒後にツールチップを自動で消す
  setTimeout(() => {
    if (!isDragging) { // まだドラッグ中でなければ消す
      setTooltipVisible(false)
    }
  }, 3000)
}
```

**実装時間**: 30分（タスク1.2と統合）

**テスト項目**:
- [ ] スライド開始時にツールチップが表示される
- [ ] スライド中、指の位置に合わせてツールチップが移動する
- [ ] ツールチップに正しい文のプレビューが表示される
- [ ] スライド終了後、3秒でツールチップが消える

---

### タスク 1.4: 文番号表示の修正

**目的**: 文マーカーの上に表示される番号が見えるようにする

**現在の問題**: `top: -16px` だと番号がクリップされて見えない可能性

**対象ファイル**: `frontend/src/components/features/AudioPlayer/styles.css`

**変更内容**:
```css
.sentence-marker-number {
  position: absolute;
  top: -24px; /* -16px → -24px に変更 */
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: #2196F3;
  font-weight: 600;
  white-space: nowrap;
  pointer-events: none;
  z-index: 10; /* 追加: 他の要素より前面に */
}

@media (max-width: 768px) {
  .sentence-marker-number {
    top: auto;
    bottom: -24px; /* シークバーの下に表示 */
    font-size: 12px; /* 少し大きく */
  }
}
```

**親要素の調整**:
```css
.progress-bar-container {
  position: relative;
  width: 100%;
  margin-bottom: 20px;
  cursor: pointer;
  padding-top: 30px; /* 上部の番号表示スペースを確保 */
}

@media (max-width: 768px) {
  .progress-bar-container {
    padding-top: 0;
    padding-bottom: 30px; /* モバイルは下部にスペース */
  }
}
```

**実装時間**: 15分

**テスト項目**:
- [ ] デスクトップでシークバーの上に番号が表示される
- [ ] モバイルでシークバーの下に番号が表示される
- [ ] 番号がクリップされずに完全に見える
- [ ] 20文未満: 全文に番号
- [ ] 20文以上: 5の倍数の文のみ番号表示

---

## Phase 2: 文リスト機能

### タスク 2.1: App.tsx でOCRテキストとSentenceListの表示切り替え

**目的**: 音声生成後は TextEditor を非表示にし、SentenceList を表示

**対象ファイル**: `frontend/src/App.tsx`

**現在のコード（103-111行目）**:
```typescript
{ocrText && showText && (
  <section className="editor-section">
    <TextEditor
      initialText={ocrText}
      onGenerateSpeech={handleGenerateSpeech}
      isGenerating={isGeneratingSpeech}
    />
  </section>
)}
```

**修正後**:
```typescript
{/* 音声生成前のみTextEditorを表示 */}
{ocrText && !audioUrl && (
  <section className="editor-section">
    <TextEditor
      initialText={ocrText}
      onGenerateSpeech={handleGenerateSpeech}
      isGenerating={isGeneratingSpeech}
    />
  </section>
)}

{/* 音声生成後はSentenceListを表示 */}
{audioUrl && ocrSentences.length > 0 && (
  <section className="sentence-list-section">
    <SentenceList
      sentences={ocrSentences}
      sentenceTimings={sentenceTimings}
      currentSentenceIndex={currentSentenceIndex}
      isPlaying={isPlaying}
      onSentenceClick={handleSentenceSeek}
    />
  </section>
)}
```

**追加する関数（App.tsx）**:
```typescript
const handleSentenceSeek = (index: number) => {
  // AudioPlayerのaudioRefにアクセスする必要がある
  // → AudioPlayerからcallbackを受け取る形に変更が必要
  // または、App.tsxでaudioRefを管理する
}
```

**注意**: AudioPlayer コンポーネントは内部で audioRef を管理しているため、以下のいずれかの対応が必要:

**オプションA**: AudioPlayer に `onSeekRequest` プロップを追加
```typescript
// AudioPlayer.tsx
interface AudioPlayerProps {
  // ... 既存のprops
  onSeekRequest?: (timestamp: number) => void
}

// App.tsx
const audioPlayerRef = useRef<{ seekTo: (timestamp: number) => void } | null>(null)

const handleSentenceSeek = (index: number) => {
  if (sentenceTimings[index]) {
    audioPlayerRef.current?.seekTo(sentenceTimings[index].timestamp)
  }
}
```

**オプションB**: App.tsx で audioRef を管理し、AudioPlayer に渡す（推奨）
```typescript
// App.tsx
const audioRef = useRef<HTMLAudioElement>(null)

const handleSentenceSeek = (index: number) => {
  if (audioRef.current && sentenceTimings[index]) {
    audioRef.current.currentTime = sentenceTimings[index].timestamp
    audioRef.current.play()
  }
}

// AudioPlayer に audioRef を渡す
<AudioPlayer
  audioRef={audioRef}
  // ... 他のprops
/>
```

**実装方針**: オプションBを採用（よりシンプル）

**削除するもの**: `showText` state と テキスト表示/非表示トグルボタン（不要になる）

**実装時間**: 20分

**テスト項目**:
- [ ] 音声生成前: TextEditor が表示される
- [ ] 音声生成後: TextEditor が非表示、SentenceList が表示される
- [ ] 新しい画像をアップロード→OCR後: TextEditor が再表示される

---

### タスク 2.2: SentenceList コンポーネント作成

**目的**: 文リストを表示するコンポーネントを作成

**新規ファイル**: `frontend/src/components/features/SentenceList/SentenceList.tsx`

**Props定義**:
```typescript
import type { SentenceTiming } from '@/types/api'

export interface SentenceListProps {
  sentences: string[]
  sentenceTimings: SentenceTiming[]
  currentSentenceIndex: number
  isPlaying: boolean
  onSentenceClick: (index: number) => void
}
```

**State定義**:
```typescript
const [isCollapsed, setIsCollapsed] = useState(false)
const [autoScroll, setAutoScroll] = useState(true)
const sentenceListRef = useRef<HTMLDivElement>(null)
```

**基本構造**:
```typescript
import { useState, useRef, useEffect } from 'react'
import type { SentenceListProps } from './types'
import './styles.css'

export const SentenceList: React.FC<SentenceListProps> = ({
  sentences,
  sentenceTimings,
  currentSentenceIndex,
  isPlaying,
  onSentenceClick,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const sentenceListRef = useRef<HTMLDivElement>(null)

  return (
    <div className="sentence-list">
      {/* ヘッダー部分（タスク 2.3 で実装） */}
      <div className="sentence-list-header">
        <h3>文リスト (全{sentences.length}文)</h3>
        <div className="header-controls">
          <label>
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            自動スクロール
          </label>
          <button onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? '展開' : '折り畳む'}
          </button>
        </div>
      </div>

      {/* リスト部分（タスク 2.4-2.7 で実装） */}
      {!isCollapsed && (
        <div className="sentence-list-content" ref={sentenceListRef}>
          {sentences.map((sentence, index) => (
            <div
              key={index}
              data-sentence-index={index}
              className={`sentence-item ${
                index === currentSentenceIndex ? 'current' : ''
              }`}
              onClick={() => onSentenceClick(index)}
            >
              <span className="sentence-number">{index + 1}</span>
              <span className="sentence-text">{sentence}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

**新規ファイル**: `frontend/src/components/features/SentenceList/index.ts`
```typescript
export { SentenceList } from './SentenceList'
export type { SentenceListProps } from './SentenceList'
```

**実装時間**: 45分

**テスト項目**:
- [ ] コンポーネントが正しくレンダリングされる
- [ ] 文の数が正しく表示される
- [ ] 各文がクリック可能

---

### タスク 2.3: 折り畳み機能

**目的**: リストを折り畳んで非表示にできるようにする

**対象ファイル**: `frontend/src/components/features/SentenceList/SentenceList.tsx`（タスク2.2で作成済み）

**CSS追加**: `frontend/src/components/features/SentenceList/styles.css`
```css
.sentence-list {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 24px;
  border: 1px solid #ddd;
  border-radius: 12px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.sentence-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.sentence-list-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.header-controls {
  display: flex;
  gap: 16px;
  align-items: center;
}

.header-controls label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

.header-controls input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.header-controls button {
  padding: 8px 16px;
  border: 1px solid #4CAF50;
  border-radius: 6px;
  background-color: white;
  color: #4CAF50;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.header-controls button:hover {
  background-color: #4CAF50;
  color: white;
}

.sentence-list-content {
  max-height: 500px;
  overflow-y: auto;
  transition: max-height 0.3s ease;
}

.sentence-list.collapsed .sentence-list-content {
  max-height: 0;
  overflow: hidden;
}
```

**実装時間**: 20分（タスク2.2に含まれる）

**テスト項目**:
- [ ] 折り畳みボタンをクリックするとリストが非表示になる
- [ ] 再度クリックすると展開される
- [ ] アニメーションがスムーズ

---

### タスク 2.4: 可視範囲の制御（現在文 + 前後3文）

**目的**: 再生中は現在の文とその前後3文（計7文）のみを強調表示

**対象ファイル**: `frontend/src/components/features/SentenceList/SentenceList.tsx`

**ロジック追加**:
```typescript
const getVisibleRange = () => {
  if (!isPlaying) {
    // 再生していない時は全文を同じ扱い
    return { start: 0, end: sentences.length }
  }

  const start = Math.max(0, currentSentenceIndex - 3)
  const end = Math.min(sentences.length, currentSentenceIndex + 4)
  return { start, end }
}

const { start, end } = getVisibleRange()

const isInVisibleRange = (index: number) => {
  return index >= start && index < end
}
```

**JSX修正**:
```typescript
{sentences.map((sentence, index) => (
  <div
    key={index}
    data-sentence-index={index}
    className={`sentence-item ${
      index === currentSentenceIndex ? 'current' : ''
    } ${
      isPlaying && !isInVisibleRange(index) ? 'out-of-range' : ''
    }`}
    onClick={() => onSentenceClick(index)}
  >
    <span className="sentence-number">{index + 1}</span>
    <span className="sentence-text">{sentence}</span>
  </div>
))}
```

**CSS追加**:
```css
.sentence-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sentence-item:hover {
  background-color: #f5f5f5;
}

.sentence-item.current {
  background-color: #e8f5e9;
  border-left: 4px solid #4CAF50;
}

.sentence-item.out-of-range {
  opacity: 0.3;
}

.sentence-number {
  flex-shrink: 0;
  width: 36px;
  font-size: 14px;
  font-weight: 600;
  color: #2196F3;
  text-align: right;
}

.sentence-text {
  flex: 1;
  font-size: 14px;
  color: #333;
  line-height: 1.6;
}
```

**実装時間**: 30分

**テスト項目**:
- [ ] 再生中、現在文 + 前後3文が通常の濃さで表示
- [ ] 可視範囲外の文は薄く表示（opacity: 0.3）
- [ ] 停止中は全文が通常の濃さ
- [ ] 現在文は緑色の背景でハイライト

---

### タスク 2.5: 自動スクロール機能（トグル可能）

**目的**: 再生に合わせて現在の文が常に見える位置に自動スクロール

**対象ファイル**: `frontend/src/components/features/SentenceList/SentenceList.tsx`

**useEffect追加**:
```typescript
useEffect(() => {
  if (isPlaying && autoScroll && sentenceListRef.current) {
    const currentElement = sentenceListRef.current.querySelector(
      `[data-sentence-index="${currentSentenceIndex}"]`
    ) as HTMLElement

    if (currentElement) {
      currentElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }
}, [currentSentenceIndex, isPlaying, autoScroll])
```

**手動スクロール検知（オプション）**:
```typescript
const [userScrolled, setUserScrolled] = useState(false)

useEffect(() => {
  const listElement = sentenceListRef.current
  if (!listElement) return

  const handleScroll = () => {
    if (isPlaying && autoScroll) {
      // ユーザーが手動でスクロールした場合、一時的に自動スクロールを無効化
      setUserScrolled(true)
      setTimeout(() => setUserScrolled(false), 3000)
    }
  }

  listElement.addEventListener('scroll', handleScroll)
  return () => listElement.removeEventListener('scroll', handleScroll)
}, [isPlaying, autoScroll])

// 自動スクロール実行時に userScrolled をチェック
useEffect(() => {
  if (isPlaying && autoScroll && !userScrolled && sentenceListRef.current) {
    // ... scrollIntoView
  }
}, [currentSentenceIndex, isPlaying, autoScroll, userScrolled])
```

**実装時間**: 25分

**テスト項目**:
- [ ] 再生中、現在文が常に画面中央に表示される
- [ ] 自動スクロールのチェックを外すと自動スクロールしない
- [ ] 手動スクロール後、3秒間自動スクロールが一時停止（オプション実装の場合）

---

### タスク 2.6: 仮想スクロール（再生していない時）

**目的**: 停止中は全文を自由にスクロールして閲覧可能

**対象ファイル**: `frontend/src/components/features/SentenceList/SentenceList.tsx`

**実装内容**: タスク2.4で既に実装済み
- 停止中は `isInVisibleRange` が常に true を返すため、全文が通常の濃さで表示される
- CSS の `overflow-y: auto` により、自由にスクロール可能

**パフォーマンス最適化（50文以上の場合）**:

50文未満の場合は通常のレンダリングで十分なパフォーマンス。
50文以上の場合は react-window を検討するが、今回は不要と判断。

**理由**:
- 各文は軽量なテキスト要素のみ
- 100文でも十分スムーズにスクロール可能
- react-window 導入はコード複雑化のデメリットが大きい

**実装時間**: 15分（実質、追加実装なし）

**テスト項目**:
- [ ] 停止中、全文が表示される
- [ ] スクロールバーが表示され、スムーズにスクロール可能
- [ ] 100文以上でもパフォーマンス問題なし

---

### タスク 2.7: 文クリックでシーク

**目的**: 文をクリックするとその文の位置に音声がシークされる

**対象ファイル**:
- `frontend/src/components/features/SentenceList/SentenceList.tsx`（既に実装済み）
- `frontend/src/App.tsx`（タスク2.1で対応）

**SentenceList.tsx**:
```typescript
// 既にタスク2.2で実装済み
<div
  className="sentence-item"
  onClick={() => onSentenceClick(index)}
>
  {/* ... */}
</div>
```

**App.tsx**:
```typescript
// タスク2.1で実装
const handleSentenceSeek = (index: number) => {
  if (audioRef.current && sentenceTimings[index]) {
    audioRef.current.currentTime = sentenceTimings[index].timestamp
    // 必要に応じて再生開始
    if (!isPlaying) {
      audioRef.current.play()
    }
  }
}
```

**追加の考慮点**: AudioPlayer の currentSentenceIndex を更新する必要がある

**App.tsx にさらに追加**:
```typescript
const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0)

const handleSentenceSeek = (index: number) => {
  if (audioRef.current && sentenceTimings[index]) {
    audioRef.current.currentTime = sentenceTimings[index].timestamp
    setCurrentSentenceIndex(index) // これを追加

    if (!isPlaying) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }
}

// AudioPlayer と SentenceList の両方に currentSentenceIndex を渡す
```

**実装時間**: 20分

**テスト項目**:
- [ ] 文をクリックすると音声がその位置にジャンプ
- [ ] 停止中にクリックすると再生が開始される
- [ ] クリックした文がハイライトされる
- [ ] クリック後、自動スクロールが正常に動作

---

### タスク 2.8: スタイリング

**目的**: モバイル対応とUIの最終調整

**対象ファイル**: `frontend/src/components/features/SentenceList/styles.css`

**モバイル対応追加**:
```css
@media (max-width: 768px) {
  .sentence-list {
    padding: 16px;
  }

  .sentence-list-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .sentence-list-header h3 {
    font-size: 16px;
  }

  .header-controls {
    width: 100%;
    justify-content: space-between;
  }

  .header-controls label {
    font-size: 13px;
  }

  .header-controls button {
    padding: 10px 16px;
    min-height: 44px; /* Apple HIG */
    font-size: 15px;
  }

  .sentence-list-content {
    max-height: 400px; /* モバイルは少し低く */
  }

  .sentence-item {
    padding: 16px 12px; /* タップしやすいように */
    min-height: 44px;
  }

  .sentence-number {
    width: 32px;
    font-size: 13px;
  }

  .sentence-text {
    font-size: 15px;
  }
}
```

**アクセシビリティ向上**:
```css
/* フォーカス時のスタイル */
.sentence-item:focus {
  outline: 2px solid #4CAF50;
  outline-offset: 2px;
}

/* キーボード操作サポート */
.sentence-item {
  /* ... */
  user-select: none; /* 誤選択防止 */
}

/* スクロールバーのスタイリング（Webkit） */
.sentence-list-content::-webkit-scrollbar {
  width: 8px;
}

.sentence-list-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.sentence-list-content::-webkit-scrollbar-thumb {
  background: #4CAF50;
  border-radius: 4px;
}

.sentence-list-content::-webkit-scrollbar-thumb:hover {
  background: #45a049;
}
```

**実装時間**: 30分

**テスト項目**:
- [ ] モバイルで各要素が44px以上のタップターゲット
- [ ] スクロールバーが見やすい
- [ ] ホバー・フォーカス時の視覚フィードバックが適切
- [ ] テキストが読みやすいサイズ・行間

---

## 実装順序

### Phase 1: シークバー改善（セッション1回で完了可能）

1. タスク 1.1: シークバー高さ変更（15分）
2. タスク 1.2: スライド操作実装（30分）
3. タスク 1.3: ツールチップ常時表示（30分、1.2と統合）
4. タスク 1.4: 文番号表示修正（15分）
5. **動作確認**: デスクトップ・モバイルでテスト（15分）
6. **Git commit**: "Phase 3A修正: シークバー改善"

**Phase 1 合計**: 約1.5時間

---

### Phase 2: 文リスト機能（セッション2-3回に分割可能）

#### セッション A: 基本構造（1時間）
1. タスク 2.1: App.tsx 修正（20分）
2. タスク 2.2: SentenceList コンポーネント作成（45分）
3. **動作確認**: リストが表示されることを確認（10分）
4. **Git commit**: "Phase 3A: 文リスト基本構造"

#### セッション B: コア機能（1.5時間）
1. タスク 2.3: 折り畳み機能（20分、2.2に含まれる）
2. タスク 2.4: 可視範囲制御（30分）
3. タスク 2.5: 自動スクロール（25分）
4. タスク 2.6: 仮想スクロール（15分、実質追加なし）
5. タスク 2.7: シーク機能（20分）
6. **動作確認**: 全機能のテスト（20分）
7. **Git commit**: "Phase 3A: 文リストコア機能"

#### セッション C: 仕上げ（30分）
1. タスク 2.8: スタイリング（30分）
2. **最終確認**: デスクトップ・モバイルでE2Eテスト（20分）
3. **Git commit**: "Phase 3A: 文リストUI完成"

**Phase 2 合計**: 約3時間

---

## 総実装時間: 4.5時間

---

## Git Commit メッセージ（案）

### Phase 1 完了時:
```
Phase 3A修正: シークバー改善とモバイル最適化

- シークバー高さを44pxに変更（モバイル）
- スライド操作でシーク可能に（タッチイベント実装）
- スライド中に常時ツールチップ表示
- 文マーカー番号の表示位置修正
- isDragging state追加
- calculateSeekPosition, handleTouchMove実装
- モバイルCSS調整（44px tap target）

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Phase 2 完了時:
```
Phase 3A新機能: 文リスト実装

- SentenceListコンポーネント新規作成
- 音声生成後、OCRテキストを非表示に変更
- プレーヤー下に文リストを表示
- 折り畳み機能実装
- 再生中: 現在文+前後3文を強調表示
- 自動スクロール機能（トグル可能）
- 文クリックでシーク機能
- モバイル最適化（44px+ tap targets）
- App.tsx: audioRef管理をApp層に移動
- showText state削除（不要になったため）

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## 技術的課題と解決策

### 課題1: 自動スクロールと手動スクロールの競合

**問題**: ユーザーが手動スクロール中に自動スクロールが発動すると、操作が妨げられる

**解決策**:
- ユーザーが手動スクロールを開始したら `userScrolled` フラグを立てる
- 3秒間は自動スクロールを停止
- 3秒後に自動スクロールを再開

**実装**: タスク2.5の「手動スクロール検知（オプション）」参照

---

### 課題2: 可視範囲外の文の扱い

**問題**: 100文以上の場合、全てレンダリングするとパフォーマンスに影響する可能性

**解決策**:
- 現時点では全文レンダリング（opacity で制御）
- パフォーマンス問題が発生した場合のみ react-window を導入
- 各文は軽量なため、200文程度までは問題なし

**実装**: タスク2.6参照

---

### 課題3: モバイルでのタッチ操作とスクロールの競合

**問題**: シークバーのスライド操作時に、ページ全体がスクロールしてしまう

**解決策**:
- `handleTouchMove` 内で `e.preventDefault()` を呼び出す
- シークバー上のタッチイベントのみデフォルト動作を無効化
- 文リストのスクロールは通常通り動作

**実装**: タスク1.2の `handleTouchMove` 参照

---

### 課題4: audioRef の管理場所

**問題**: AudioPlayer が内部で audioRef を管理しているため、App.tsx から音声位置を制御できない

**解決策**:
- App.tsx で audioRef を作成し、AudioPlayer に props で渡す
- AudioPlayer は受け取った audioRef を使用する（独自に createRef しない）
- これにより、App.tsx から自由に音声位置を制御可能

**実装**: タスク2.1のオプションB参照

---

### 課題5: currentSentenceIndex の同期

**問題**: 文クリック時、AudioPlayer の currentSentenceIndex を更新する必要がある

**解決策**:
- currentSentenceIndex を App.tsx で管理
- AudioPlayer と SentenceList の両方に props で渡す
- AudioPlayer 内で timeupdate イベント時に App.tsx の setCurrentSentenceIndex を呼ぶ

**必要な修正**:
```typescript
// App.tsx
const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0)

<AudioPlayer
  onSentenceChange={setCurrentSentenceIndex}
  // ...
/>

// AudioPlayer.tsx
interface AudioPlayerProps {
  onSentenceChange?: (index: number) => void
  // ...
}

// timeupdate ハンドラー内
if (newIndex !== currentSentenceIndex) {
  setCurrentSentenceIndex(newIndex)
  onSentenceChange?.(newIndex)
}
```

**実装**: タスク2.1, 2.7で対応

---

## テスト項目一覧

### Phase 1: シークバー改善

- [ ] **1.1**: モバイルでシークバーが44px高
- [ ] **1.1**: デスクトップでは8pxのまま
- [ ] **1.1**: 文マーカーが44pxに伸びている
- [ ] **1.2**: モバイルでスライドするとシーク
- [ ] **1.2**: スライド中に音が再生される
- [ ] **1.2**: デスクトップのクリック操作は正常
- [ ] **1.2**: スライド中にページがスクロールしない
- [ ] **1.3**: スライド開始時にツールチップ表示
- [ ] **1.3**: スライド中、指の位置に合わせて移動
- [ ] **1.3**: 正しい文のプレビューが表示
- [ ] **1.3**: スライド終了後、3秒で消える
- [ ] **1.4**: デスクトップでシークバー上に番号表示
- [ ] **1.4**: モバイルでシークバー下に番号表示
- [ ] **1.4**: 番号がクリップされない
- [ ] **1.4**: 20文未満は全文に番号
- [ ] **1.4**: 20文以上は5の倍数のみ

### Phase 2: 文リスト機能

- [ ] **2.1**: 音声生成前はTextEditor表示
- [ ] **2.1**: 音声生成後はSentenceList表示、TextEditor非表示
- [ ] **2.1**: 新画像アップロード後、TextEditor再表示
- [ ] **2.2**: コンポーネントが正しくレンダリング
- [ ] **2.2**: 文の数が正しく表示
- [ ] **2.2**: 各文がクリック可能
- [ ] **2.3**: 折り畳みボタンでリスト非表示
- [ ] **2.3**: 再度クリックで展開
- [ ] **2.3**: アニメーションがスムーズ
- [ ] **2.4**: 再生中、現在文+前後3文が通常の濃さ
- [ ] **2.4**: 可視範囲外は薄く表示
- [ ] **2.4**: 停止中は全文が通常の濃さ
- [ ] **2.4**: 現在文は緑色の背景
- [ ] **2.5**: 再生中、現在文が画面中央に
- [ ] **2.5**: 自動スクロールチェック解除で無効化
- [ ] **2.5**: 手動スクロール後、3秒間一時停止（オプション）
- [ ] **2.6**: 停止中、全文表示
- [ ] **2.6**: スクロールバー表示、スムーズにスクロール
- [ ] **2.6**: 100文以上でもパフォーマンス問題なし
- [ ] **2.7**: 文クリックで音声がジャンプ
- [ ] **2.7**: 停止中クリックで再生開始
- [ ] **2.7**: クリックした文がハイライト
- [ ] **2.7**: クリック後、自動スクロール正常動作
- [ ] **2.8**: モバイルで44px以上のタップターゲット
- [ ] **2.8**: スクロールバーが見やすい
- [ ] **2.8**: ホバー・フォーカス時の視覚フィードバック
- [ ] **2.8**: テキストが読みやすいサイズ・行間

---

## セッション間の引き継ぎ事項

### セッション終了時に記録すること

1. **完了したタスク**: どのタスクまで完了したか明記
2. **未完了のタスク**: 次回開始するタスク番号
3. **発見した問題**: 実装中に見つかった想定外の問題
4. **仕様変更**: ユーザーからの追加要望や仕様変更
5. **Git commit**: 各セッション終了時に必ずコミット

### セッション開始時に確認すること

1. **前回の進捗**: このドキュメントの「完了したタスク」を確認
2. **Git log**: 最新のコミットを確認
3. **動作確認**: 前回実装した機能が正常に動作するか確認
4. **次のタスク**: 「実装順序」セクションから次のタスクを特定

---

## 関連ドキュメント

- `docs/sessions/TODO.md`: 全体のタスク管理
- `docs/LEARNING_ENHANCEMENT.md`: 学習機能の理論的背景
- `docs/USABILITY_REPORT.md`: ユーザビリティ評価
- `docs/sessions/HANDOVER.md`: セッション間の引き継ぎ
- `docs/sessions/SUMMARY.md`: プロジェクト進捗サマリー

---

## 変更履歴

| 日付 | セッション | 変更内容 |
|------|-----------|---------|
| 2025-10-22 | #15 | 初版作成 |

