# AudioPlayer リファクタリング計画書

**作成日**: 2025-10-23
**目的**: AudioPlayerを機能ごとに分割し、保守性とコードの見通しを改善

---

## 📊 現状分析

### 問題点

1. **ファイルサイズ**: `AudioPlayer.tsx` 約1000行
2. **複数の責務**:
   - 音声再生制御
   - UI表示（シークバー、ボタン）
   - 文検出・ナビゲーション
   - リピート機能
   - ポーズ機能
   - キーボードショートカット
3. **デバッグ困難**: 機能が密結合
4. **テスト困難**: 全体をテストする必要がある
5. **並行開発不可**: 1つのファイルに全員が触る

### 目標

- **各ファイル200-300行以内**
- **Single Responsibility Principle（単一責任の原則）**
- **再利用可能なHooks**
- **テスト容易性**
- **並行開発可能**

---

## 🎯 リファクタリング後の構造

```
frontend/src/components/features/AudioPlayer/
├── AudioPlayer.tsx                    # メインコンポーネント（200-250行）
├── index.ts                           # エクスポート
├── styles.css                         # スタイル（既存）
├── types.ts                           # 型定義（NEW）
├── hooks/
│   ├── index.ts                       # Hooksエクスポート
│   ├── useAudioPlayback.ts            # 基本再生制御（NEW）
│   ├── useAudioSegments.ts            # 分離音声モード（NEW）
│   ├── useSentenceNavigation.ts       # 文ナビゲーション（NEW）
│   ├── useRepeatControl.ts            # リピート機能（NEW）
│   ├── usePauseControl.ts             # ポーズ機能（NEW）
│   └── useKeyboardShortcuts.ts        # キーボードショートカット（NEW）
├── components/
│   ├── index.ts                       # コンポーネントエクスポート
│   ├── PlaybackControls.tsx           # 再生/一時停止、速度調整（NEW）
│   ├── ProgressBar.tsx                # シークバー、文マーカー（NEW）
│   ├── SentenceControls.tsx           # 前の文/次の文ボタン（NEW）
│   ├── RepeatSettings.tsx             # リピート設定UI（NEW）
│   └── ShortcutsHelp.tsx              # ショートカット一覧（NEW）
└── utils/
    ├── index.ts                       # ユーティリティエクスポート
    └── audioHelpers.ts                # 音声関連ヘルパー関数（NEW）
```

---

## 🔧 詳細設計

### 1. 型定義ファイル (`types.ts`)

**目的**: AudioPlayer固有の型を一箇所に集約

**内容**:
```typescript
export interface AudioPlayerProps {
  audioUrl: string | null
  sourceText?: string
  sourceSentences?: string[]
  sentenceTimings?: SentenceTiming[]
  audioSegments?: Blob[]
  segmentDurations?: number[]
  externalSentenceIndex?: number
  onPlaybackComplete?: () => void
  onSentenceChange?: (index: number) => void
  onPlayStateChange?: (isPlaying: boolean) => void
}

export interface PlaybackState {
  isPlaying: boolean
  currentTime: number
  duration: number
  speed: number
  isLoading: boolean
}

export interface SentenceState {
  currentIndex: number
  total: number
  boundaries: SentenceBoundary[]
}

export interface RepeatState {
  count: number // 1, 3, 5, -1 (infinite)
  current: number
  autoAdvance: boolean
  autoPauseAfterSentence: boolean
}

export interface SegmentState {
  segments: string[] // Blob URLs
  durations: number[]
  currentIndex: number
  totalDuration: number
}
```

---

### 2. Custom Hooks

#### 2.1 `useAudioPlayback.ts` - 基本再生制御

**責務**: 音声の再生/一時停止、速度調整、シーク

**API**:
```typescript
export function useAudioPlayback(audioRef: RefObject<HTMLAudioElement>) {
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    speed: 1.0,
    isLoading: false,
  })

  const play = async () => { ... }
  const pause = () => { ... }
  const setSpeed = (speed: number) => { ... }
  const seek = (time: number) => { ... }

  return {
    playbackState,
    play,
    pause,
    setSpeed,
    seek,
  }
}
```

**サイズ**: 約100行

---

#### 2.2 `useAudioSegments.ts` - 分離音声モード（最重要）

**責務**: 音声セグメントの管理、切り替え、プリロード

**API**:
```typescript
export function useAudioSegments(
  audioRef: RefObject<HTMLAudioElement>,
  audioSegments: Blob[] | undefined,
  segmentDurations: number[] | undefined
) {
  const [segmentState, setSegmentState] = useState<SegmentState>({
    segments: [],
    durations: [],
    currentIndex: 0,
    totalDuration: 0,
  })

  // Initialize: Create blob URLs from blobs
  useEffect(() => {
    if (!audioSegments || audioSegments.length === 0) return

    const urls = audioSegments.map(blob => URL.createObjectURL(blob))
    setSegmentState({
      segments: urls,
      durations: segmentDurations || [],
      currentIndex: 0,
      totalDuration: (segmentDurations || []).reduce((a, b) => a + b, 0),
    })

    // Load first segment
    if (audioRef.current && urls[0]) {
      audioRef.current.src = urls[0]
      audioRef.current.load()
    }

    // Cleanup
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url))
    }
  }, [audioSegments, segmentDurations])

  // Switch to segment
  const switchToSegment = async (index: number) => {
    if (index < 0 || index >= segmentState.segments.length) return

    setSegmentState(prev => ({ ...prev, currentIndex: index }))

    if (audioRef.current && segmentState.segments[index]) {
      audioRef.current.src = segmentState.segments[index]
      audioRef.current.load()
    }
  }

  // Preload next segment
  const preloadNextSegment = () => {
    const nextIndex = segmentState.currentIndex + 1
    if (nextIndex < segmentState.segments.length) {
      const nextAudio = new Audio(segmentState.segments[nextIndex])
      nextAudio.preload = 'auto'
    }
  }

  return {
    segmentState,
    switchToSegment,
    preloadNextSegment,
    hasNextSegment: segmentState.currentIndex < segmentState.segments.length - 1,
    hasPrevSegment: segmentState.currentIndex > 0,
  }
}
```

**サイズ**: 約150行

---

#### 2.3 `useSentenceNavigation.ts` - 文ナビゲーション

**責務**: 文の前後移動、文クリックでのシーク

**API**:
```typescript
export function useSentenceNavigation(
  currentIndex: number,
  totalSentences: number,
  onSentenceChange: (index: number) => void,
  switchToSegment: (index: number) => Promise<void> // From useAudioSegments
) {
  const goToPrevSentence = async () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1
      onSentenceChange(prevIndex)
      await switchToSegment(prevIndex)
    }
  }

  const goToNextSentence = async () => {
    if (currentIndex < totalSentences - 1) {
      const nextIndex = currentIndex + 1
      onSentenceChange(nextIndex)
      await switchToSegment(nextIndex)
    }
  }

  const goToSentence = async (index: number) => {
    if (index >= 0 && index < totalSentences) {
      onSentenceChange(index)
      await switchToSegment(index)
    }
  }

  return {
    goToPrevSentence,
    goToNextSentence,
    goToSentence,
    hasPrev: currentIndex > 0,
    hasNext: currentIndex < totalSentences - 1,
  }
}
```

**サイズ**: 約80行

---

#### 2.4 `useRepeatControl.ts` - リピート機能

**責務**: リピート回数管理、自動進行制御

**API**:
```typescript
export function useRepeatControl() {
  const [repeatState, setRepeatState] = useState<RepeatState>({
    count: 1,
    current: 0,
    autoAdvance: true,
    autoPauseAfterSentence: false,
  })

  const setRepeatCount = (count: number) => {
    setRepeatState(prev => ({ ...prev, count, current: 0 }))
  }

  const incrementRepeat = () => {
    setRepeatState(prev => ({ ...prev, current: prev.current + 1 }))
  }

  const resetRepeat = () => {
    setRepeatState(prev => ({ ...prev, current: 0 }))
  }

  const shouldRepeat = (): boolean => {
    const { count, current } = repeatState
    return count === -1 || current < count - 1
  }

  return {
    repeatState,
    setRepeatCount,
    incrementRepeat,
    resetRepeat,
    shouldRepeat,
    setAutoAdvance: (value: boolean) =>
      setRepeatState(prev => ({ ...prev, autoAdvance: value })),
    setAutoPauseAfterSentence: (value: boolean) =>
      setRepeatState(prev => ({ ...prev, autoPauseAfterSentence: value })),
  }
}
```

**サイズ**: 約100行

---

#### 2.5 `usePauseControl.ts` - ポーズ機能

**責務**: 文間のポーズ設定、タイマー管理

**API**:
```typescript
export function usePauseControl() {
  const [pauseConfig, setPauseConfig] = useState<PauseConfig>({
    enabled: false,
    duration: 1.0,
  })
  const [isPauseBetweenSentences, setIsPauseBetweenSentences] = useState(false)
  const pauseTimeoutRef = useRef<number | null>(null)

  const applyPause = async (callback: () => void) => {
    if (!pauseConfig.enabled) {
      callback()
      return
    }

    setIsPauseBetweenSentences(true)

    pauseTimeoutRef.current = window.setTimeout(() => {
      setIsPauseBetweenSentences(false)
      callback()
    }, pauseConfig.duration * 1000)
  }

  const cancelPause = () => {
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current)
      pauseTimeoutRef.current = null
    }
    setIsPauseBetweenSentences(false)
  }

  return {
    pauseConfig,
    setPauseConfig,
    isPauseBetweenSentences,
    applyPause,
    cancelPause,
  }
}
```

**サイズ**: 約80行

---

#### 2.6 `useKeyboardShortcuts.ts` - キーボードショートカット

**責務**: キーボードイベントのハンドリング

**API**:
```typescript
export function useKeyboardShortcuts(
  play: () => void,
  pause: () => void,
  goToPrevSentence: () => void,
  goToNextSentence: () => void,
  increaseSpeed: () => void,
  decreaseSpeed: () => void,
  toggleShortcutsHelp: () => void
) {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault()
          isPlaying ? pause() : play()
          break
        case 'ArrowLeft':
          e.preventDefault()
          goToPrevSentence()
          break
        case 'ArrowRight':
          e.preventDefault()
          goToNextSentence()
          break
        case 'ArrowUp':
          e.preventDefault()
          increaseSpeed()
          break
        case 'ArrowDown':
          e.preventDefault()
          decreaseSpeed()
          break
        case '?':
          e.preventDefault()
          toggleShortcutsHelp()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [play, pause, ...])

  return null
}
```

**サイズ**: 約100行

---

### 3. UI コンポーネント

#### 3.1 `PlaybackControls.tsx` - 再生コントロール

**責務**: 再生/一時停止ボタン、速度プリセット

**Props**:
```typescript
interface PlaybackControlsProps {
  isPlaying: boolean
  speed: number
  onPlay: () => void
  onPause: () => void
  onSpeedChange: (speed: number) => void
}
```

**サイズ**: 約150行（UI + スタイル）

---

#### 3.2 `ProgressBar.tsx` - プログレスバー

**責務**: シークバー、文マーカー、ツールチップ

**Props**:
```typescript
interface ProgressBarProps {
  currentTime: number
  duration: number
  sentences: SentenceBoundary[]
  onSeek: (time: number) => void
  isDragging: boolean
  onDragStart: () => void
  onDragEnd: () => void
}
```

**サイズ**: 約200行

---

#### 3.3 `SentenceControls.tsx` - 文コントロール

**責務**: 前の文/次の文ボタン、文番号表示

**Props**:
```typescript
interface SentenceControlsProps {
  currentIndex: number
  totalSentences: number
  onPrev: () => void
  onNext: () => void
  hasPrev: boolean
  hasNext: boolean
}
```

**サイズ**: 約100行

---

#### 3.4 `RepeatSettings.tsx` - リピート設定

**責務**: リピート回数選択、自動進行チェックボックス

**Props**:
```typescript
interface RepeatSettingsProps {
  repeatCount: number
  currentRepeat: number
  autoAdvance: boolean
  autoPauseAfterSentence: boolean
  onRepeatCountChange: (count: number) => void
  onAutoAdvanceChange: (value: boolean) => void
  onAutoPauseChange: (value: boolean) => void
}
```

**サイズ**: 約120行

---

#### 3.5 `ShortcutsHelp.tsx` - ショートカット一覧

**責務**: ショートカット一覧モーダル

**Props**:
```typescript
interface ShortcutsHelpProps {
  visible: boolean
  onClose: () => void
}
```

**サイズ**: 約80行

---

### 4. メインコンポーネント (`AudioPlayer.tsx`)

**責務**: Hooksとコンポーネントの統合、状態管理の調整

**構成**:
```typescript
export function AudioPlayer({
  audioUrl,
  audioSegments,
  segmentDurations,
  sourceSentences,
  ...
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)

  // Custom Hooks
  const { playbackState, play, pause, setSpeed, seek } = useAudioPlayback(audioRef)
  const { segmentState, switchToSegment, preloadNextSegment, ... } = useAudioSegments(
    audioRef,
    audioSegments,
    segmentDurations
  )
  const { goToPrevSentence, goToNextSentence, ... } = useSentenceNavigation(
    segmentState.currentIndex,
    sourceSentences?.length || 0,
    onSentenceChange,
    switchToSegment
  )
  const { repeatState, shouldRepeat, incrementRepeat, ... } = useRepeatControl()
  const { pauseConfig, applyPause, ... } = usePauseControl()

  // Handle segment ended
  const handleSegmentEnded = async () => {
    if (shouldRepeat()) {
      incrementRepeat()
      await audioRef.current?.play()
    } else {
      resetRepeat()
      if (repeatState.autoAdvance && hasNextSegment) {
        await applyPause(async () => {
          await switchToSegment(segmentState.currentIndex + 1)
          await audioRef.current?.play()
        })
      } else {
        pause()
        onPlaybackComplete?.()
      }
    }
  }

  useKeyboardShortcuts(play, pause, goToPrevSentence, goToNextSentence, ...)

  return (
    <div className="audio-player">
      <audio ref={audioRef} onEnded={handleSegmentEnded} />

      <PlaybackControls
        isPlaying={playbackState.isPlaying}
        speed={playbackState.speed}
        onPlay={play}
        onPause={pause}
        onSpeedChange={setSpeed}
      />

      <ProgressBar
        currentTime={playbackState.currentTime}
        duration={segmentState.durations[segmentState.currentIndex] || 0}
        sentences={[]} // Simplified in separated mode
        onSeek={seek}
      />

      <SentenceControls
        currentIndex={segmentState.currentIndex}
        totalSentences={sourceSentences?.length || 0}
        onPrev={goToPrevSentence}
        onNext={goToNextSentence}
        hasPrev={hasPrevSegment}
        hasNext={hasNextSegment}
      />

      <RepeatSettings
        repeatCount={repeatState.count}
        currentRepeat={repeatState.current}
        autoAdvance={repeatState.autoAdvance}
        autoPauseAfterSentence={repeatState.autoPauseAfterSentence}
        onRepeatCountChange={setRepeatCount}
        onAutoAdvanceChange={setAutoAdvance}
        onAutoPauseChange={setAutoPauseAfterSentence}
      />

      <ShortcutsHelp visible={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  )
}
```

**サイズ**: 約200-250行

---

## 📋 実装順序（次回セッション）

### フェーズ1: 型定義とHooks（2時間）

1. `types.ts` 作成（15分）
2. `hooks/useAudioPlayback.ts` 実装（30分）
3. `hooks/useAudioSegments.ts` 実装（45分）⭐ 最重要
4. `hooks/useSentenceNavigation.ts` 実装（20分）
5. `hooks/useRepeatControl.ts` 実装（20分）
6. `hooks/usePauseControl.ts` 実装（15分）
7. `hooks/useKeyboardShortcuts.ts` 実装（15分）

### フェーズ2: UIコンポーネント（1.5時間）

1. `components/PlaybackControls.tsx` 実装（30分）
2. `components/ProgressBar.tsx` 実装（30分）
3. `components/SentenceControls.tsx` 実装（15分）
4. `components/RepeatSettings.tsx` 実装（20分）
5. `components/ShortcutsHelp.tsx` 実装（15分）

### フェーズ3: メインコンポーネント統合（1時間）

1. 既存`AudioPlayer.tsx`をバックアップ
2. 新しい`AudioPlayer.tsx`を実装（Hooksとコンポーネントの統合）
3. TypeScriptコンパイル確認
4. スタイル調整

### フェーズ4: テスト（30分）

1. ローカル環境でE2Eテスト
   - 音声分離モードで再生
   - リピート3回動作確認
   - 文ナビゲーション確認
   - キーボードショートカット確認
2. バグ修正

**総時間**: 約5時間

---

## 🎯 成功基準

### 機能要件

1. ✅ 音声分離モードで再生可能
2. ✅ リピート3回が確実に動作
3. ✅ 文ナビゲーション（前/次）が即座に反応
4. ✅ ポーズ機能が正常動作
5. ✅ キーボードショートカットが動作

### 非機能要件

1. ✅ 各ファイル200-300行以内
2. ✅ TypeScriptエラーなし
3. ✅ 既存機能の後方互換性維持（結合モードも動作）
4. ✅ パフォーマンス低下なし

---

## 🔗 関連ドキュメント

- **音声分離方式設計書**: `docs/SEPARATED_AUDIO_DESIGN.md`
- **既存AudioPlayer**: `frontend/src/components/features/AudioPlayer/AudioPlayer.tsx`
- **TODO**: `docs/sessions/TODO.md`

---

## 📝 備考

### リファクタリングのメリット再確認

1. **保守性**: 問題箇所を素早く特定・修正
2. **拡張性**: 新機能追加が容易（例: ブックマーク機能）
3. **テスト性**: 個別にユニットテスト可能
4. **可読性**: 各ファイルの役割が明確
5. **再利用性**: Hooksは他のコンポーネントでも利用可能

### 注意事項

- 既存の`AudioPlayer.tsx`は削除せず、`AudioPlayer.legacy.tsx`として保存
- 問題があれば即座に元に戻せるようにする
- 段階的に実装し、各フェーズで動作確認
