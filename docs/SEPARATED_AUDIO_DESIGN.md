# 音声分割方式 - 詳細設計書

**作成日**: 2025-10-23
**目的**: リピート機能のバグを完全解決するため、音声を文ごとに分割する方式を導入

---

## 📊 概要

### 現在の方式（結合方式）

```
バックエンド: 文1 + 文2 + 文3 → 1つのmp3ファイル
フロントエンド: <audio src="combined.mp3"> + タイムスタンプで制御
問題点: シーク操作のタイミング誤差、ポーズ前の音被り
```

### 新しい方式（分割方式）

```
バックエンド: 文1 → mp3_1, 文2 → mp3_2, 文3 → mp3_3
フロントエンド: <audio src="mp3_X"> を文ごとに切り替え
メリット: タイミング誤差ゼロ、リピートが単純な再生操作
```

---

## 🎯 設計方針

### コア原則

1. **既存APIとの互換性維持**
   - `/api/tts-with-timings`（結合方式）は残す
   - `/api/tts-with-timings-separated`（分割方式）を新規追加
   - フロントエンドで切り替え可能にする

2. **API利用料の増加なし**
   - 既存の`generate_speech_with_timings()`は文ごとに生成済み
   - 結合処理を省略するだけ → コスト変わらず

3. **段階的移行**
   - まず分割方式を実装
   - 動作確認後、デフォルトを分割方式に変更
   - 問題があれば結合方式に戻せる

---

## 🔧 実装詳細

### Phase 1: バックエンド実装（30-45分）

#### 1.1 新しいサービス関数の追加

**ファイル**: `backend/app/services/openai_service.py`

**新規関数**: `generate_speech_separated()`

```python
from typing import List, Tuple
import base64

def generate_speech_separated(
    self,
    sentences: List[str],
    voice: str = "nova",
    format: str = "mp3"  # mp3に固定（ffmpeg互換性）
) -> Tuple[List[dict], float]:
    """
    Generate speech with separated audio files per sentence

    Args:
        sentences: List of sentences to convert
        voice: Voice to use
        format: Audio format (mp3 recommended for compatibility)

    Returns:
        Tuple of (audio_segments, total_duration)

        audio_segments: List of dicts with:
            - index: int (sentence index)
            - audio_base64: str (base64-encoded audio)
            - text: str (sentence text)
            - duration: float (audio duration in seconds)
    """
    try:
        from pydub import AudioSegment

        # Validate inputs (same as existing function)
        valid_voices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]
        if voice not in valid_voices:
            raise TTSGenerationError(
                f"Invalid voice: {voice}. Must be one of {valid_voices}",
                error_code=ERROR_TTS_FAILED
            )

        valid_formats = ["opus", "mp3", "aac", "flac"]
        if format not in valid_formats:
            raise TTSGenerationError(
                f"Invalid format: {format}. Must be one of {valid_formats}",
                error_code=ERROR_TTS_FAILED
            )

        if not sentences or len(sentences) == 0:
            raise TTSGenerationError(
                "No sentences provided",
                error_code=ERROR_TTS_FAILED
            )

        # Generate TTS for each sentence (same as existing code)
        audio_segments = []
        total_duration = 0.0

        for idx, sentence_text in enumerate(sentences):
            if not sentence_text.strip():
                continue

            # Generate TTS for this sentence
            response = self.client.audio.speech.create(
                model=OPENAI_TTS_MODEL,
                voice=voice,
                input=sentence_text,
                response_format=format,
                speed=OPENAI_TTS_SPEED
            )

            # Read audio data
            audio_data = BytesIO()
            for chunk in response.iter_bytes():
                audio_data.write(chunk)
            audio_bytes = audio_data.getvalue()

            # Get precise duration
            duration = self._get_audio_duration(audio_bytes, format)

            # Encode to base64
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')

            # Store segment
            audio_segments.append({
                "index": idx,
                "audio_base64": audio_base64,
                "text": sentence_text,
                "duration": duration
            })

            total_duration += duration

            print(f"[TTS Separated] Sentence {idx}: {duration:.3f}s, text: {sentence_text[:30]}...")

        print(f"[TTS Separated] Generated {len(audio_segments)} separate audio files, total: {total_duration:.3f}s")

        return audio_segments, total_duration

    except TTSGenerationError:
        raise
    except Exception as e:
        raise TTSGenerationError(
            f"OpenAI TTS separated generation failed: {str(e)}",
            error_code=ERROR_TTS_FAILED
        ) from e
```

**既存関数との比較**:
- `generate_speech_with_timings()`: 286-291行で結合、317行でexport
- `generate_speech_separated()`: **結合処理を削除、base64エンコードのみ**

#### 1.2 新しいエンドポイントの追加

**ファイル**: `backend/app/api/routes/tts.py`

**新規エンドポイント**: `/api/tts-with-timings-separated`

```python
@router.post(
    "/tts-with-timings-separated",
    response_model=None,
    responses={
        200: {
            "content": {"application/json": {}},
            "description": "JSON with separated audio segments"
        },
        400: {"model": TTSErrorResponse},
        422: {"model": TTSErrorResponse},
        429: {"model": TTSErrorResponse},
        500: {"model": TTSErrorResponse},
    }
)
@limiter.limit("100/hour")
async def generate_speech_separated(
    request: Request,
    tts_request: TTSRequest
):
    """
    Generate speech with separated audio files per sentence

    Returns:
        JSON with array of audio segments (each sentence = separate audio file)
    """
    try:
        # Validate sentences
        if not tts_request.sentences or len(tts_request.sentences) == 0:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "MISSING_SENTENCES",
                    "message": "Sentences array is required for this endpoint"
                }
            )

        print(f"TTS separated - Sentences: {len(tts_request.sentences)}, Voice: {tts_request.voice}")

        # Generate separated audio files
        audio_segments, total_duration = openai_service.generate_speech_separated(
            sentences=tts_request.sentences,
            voice=tts_request.voice,
            format=tts_request.format
        )

        # Return JSON response
        return JSONResponse(content={
            "audio_segments": audio_segments,
            "total_duration": total_duration,
            "format": tts_request.format
        })

    except TTSGenerationError as e:
        import traceback
        print(f"TTS Generation Error: {e.message}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=400 if "Invalid" in e.message else 500,
            detail={
                "error": e.error_code,
                "message": e.message
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Unexpected TTS Error: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail={
                "error": ERROR_INTERNAL,
                "message": f"Internal server error: {str(e)}"
            }
        )
```

#### 1.3 レスポンススキーマの追加（オプション）

**ファイル**: `backend/app/schemas/tts.py`

```python
class AudioSegment(BaseModel):
    """Single audio segment for one sentence"""
    index: int = Field(..., description="Sentence index")
    audio_base64: str = Field(..., description="Base64-encoded audio data")
    text: str = Field(..., description="Sentence text")
    duration: float = Field(..., description="Audio duration in seconds")


class TTSResponseSeparated(BaseModel):
    """Response for separated audio generation"""
    audio_segments: List[AudioSegment] = Field(
        ...,
        description="Array of audio segments (one per sentence)"
    )
    total_duration: float = Field(
        ...,
        description="Total duration of all segments"
    )
    format: str = Field(
        ...,
        description="Audio format used"
    )
```

---

### Phase 2: フロントエンド実装（2.5-3時間）

#### 2.1 API関数の追加

**ファイル**: `frontend/src/services/api/tts.ts`

```typescript
/**
 * TTS with separated audio files (one per sentence)
 */
export async function performTTSSeparated(
  text: string,
  sentences: string[],
  voice: string = 'nova',
  format: string = 'mp3'
): Promise<{
  audioBlobs: Blob[]
  durations: number[]
  totalDuration: number
}> {
  const request: TTSRequest = {
    text,
    voice,
    format,
    sentences,
  }

  // Call new endpoint
  const response = await apiPost<{
    audio_segments: Array<{
      index: number
      audio_base64: string
      text: string
      duration: number
    }>
    total_duration: number
    format: string
  }>(API_ENDPOINTS.TTS_WITH_TIMINGS_SEPARATED, request)

  // Decode each audio segment
  const audioBlobs: Blob[] = []
  const durations: number[] = []

  for (const segment of response.audio_segments) {
    // Decode base64
    const audioData = atob(segment.audio_base64)
    const audioArray = new Uint8Array(audioData.length)
    for (let i = 0; i < audioData.length; i++) {
      audioArray[i] = audioData.charCodeAt(i)
    }

    const mimeType = format === 'mp3' ? 'audio/mpeg' : `audio/${format}`
    const audioBlob = new Blob([audioArray], { type: mimeType })

    audioBlobs.push(audioBlob)
    durations.push(segment.duration)
  }

  return {
    audioBlobs,
    durations,
    totalDuration: response.total_duration,
  }
}
```

**定数追加**: `frontend/src/constants/api.ts`

```typescript
export const API_ENDPOINTS = {
  // ... existing endpoints
  TTS_WITH_TIMINGS_SEPARATED: '/api/tts-with-timings-separated',
} as const
```

#### 2.2 AudioPlayer の大幅改造

**ファイル**: `frontend/src/components/features/AudioPlayer/AudioPlayer.tsx`

**新しいState**:

```typescript
// Separated audio mode
const [audioSegments, setAudioSegments] = useState<string[]>([]) // Array of blob URLs
const [segmentDurations, setSegmentDurations] = useState<number[]>([])
const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number>(0)
const [useSeparatedMode, setUseSeparatedMode] = useState<boolean>(true) // Toggle between modes
```

**Props追加**:

```typescript
export interface AudioPlayerProps {
  // ... existing props
  audioSegments?: Blob[] // New: separated audio blobs
  segmentDurations?: number[] // New: duration of each segment
}
```

**初期化処理**:

```typescript
// Initialize audio segments
useEffect(() => {
  if (audioSegments && audioSegments.length > 0) {
    console.log('[AudioPlayer] Using separated audio mode:', audioSegments.length, 'segments')

    // Create blob URLs
    const urls = audioSegments.map(blob => URL.createObjectURL(blob))
    setAudioSegments(urls)

    // Store durations
    if (segmentDurations) {
      setSegmentDurations(segmentDurations)
    }

    // Load first segment
    if (audioRef.current && urls[0]) {
      audioRef.current.src = urls[0]
      audioRef.current.load()
    }

    // Cleanup on unmount
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url))
    }
  }
}, [audioSegments, segmentDurations])
```

**文終了時の切り替えロジック**:

```typescript
const handleSegmentEnded = async () => {
  console.log('[AudioPlayer] Segment ended:', currentSegmentIndex)

  // Check repeat logic
  const newRepeatCount = currentRepeat + 1

  if (repeatCount === -1 || newRepeatCount < repeatCount) {
    // Repeat current segment
    console.log(`[AudioPlayer] Repeating segment ${currentSegmentIndex}: ${newRepeatCount}/${repeatCount}`)
    setCurrentRepeat(newRepeatCount)

    if (audioRef.current) {
      audioRef.current.currentTime = 0
      await audioRef.current.play()
    }
  } else {
    // Move to next segment
    setCurrentRepeat(0)

    if (autoAdvance && currentSegmentIndex < audioSegments.length - 1) {
      // Load next segment
      const nextIndex = currentSegmentIndex + 1
      console.log(`[AudioPlayer] Advancing to segment ${nextIndex}`)

      setCurrentSegmentIndex(nextIndex)
      onSentenceChange?.(nextIndex)

      if (audioRef.current && audioSegments[nextIndex]) {
        audioRef.current.src = audioSegments[nextIndex]
        audioRef.current.load()

        // Apply pause if enabled
        if (pauseConfig.enabled) {
          setIsPauseBetweenSentences(true)
          setTimeout(() => {
            setIsPauseBetweenSentences(false)
            audioRef.current?.play()
          }, pauseConfig.duration * 1000)
        } else {
          await audioRef.current.play()
        }
      }
    } else {
      // End of all segments
      console.log('[AudioPlayer] All segments completed')
      setIsPlaying(false)
      onPlayStateChange?.(false)
      onPlaybackComplete?.()
    }
  }
}

// Replace handleAudioEnded
useEffect(() => {
  if (!audioRef.current) return

  const audio = audioRef.current
  audio.addEventListener('ended', handleSegmentEnded)

  return () => {
    audio.removeEventListener('ended', handleSegmentEnded)
  }
}, [currentSegmentIndex, repeatCount, currentRepeat, autoAdvance, pauseConfig])
```

**文ナビゲーション（前/次）**:

```typescript
const handlePrevSentence = () => {
  if (currentSegmentIndex > 0) {
    const prevIndex = currentSegmentIndex - 1
    console.log(`[AudioPlayer] Moving to previous segment ${prevIndex}`)

    setCurrentSegmentIndex(prevIndex)
    setCurrentRepeat(0)
    onSentenceChange?.(prevIndex)

    if (audioRef.current && audioSegments[prevIndex]) {
      audioRef.current.src = audioSegments[prevIndex]
      audioRef.current.load()
      audioRef.current.play()
    }
  }
}

const handleNextSentence = () => {
  if (currentSegmentIndex < audioSegments.length - 1) {
    const nextIndex = currentSegmentIndex + 1
    console.log(`[AudioPlayer] Moving to next segment ${nextIndex}`)

    setCurrentSegmentIndex(nextIndex)
    setCurrentRepeat(0)
    onSentenceChange?.(nextIndex)

    if (audioRef.current && audioSegments[nextIndex]) {
      audioRef.current.src = audioSegments[nextIndex]
      audioRef.current.load()
      audioRef.current.play()
    }
  }
}
```

**シークバーの簡略化**:

```typescript
// Separated mode: シークバーは現在の文内のみ
// 文境界マーカー、ツールチップは不要（各文が独立しているため）

const handleSeekbarClick = (e: React.MouseEvent<HTMLDivElement>) => {
  if (!audioRef.current || !progressBarRef.current) return

  const rect = progressBarRef.current.getBoundingClientRect()
  const clickX = e.clientX - rect.left
  const percentage = clickX / rect.width

  // Seek within current segment
  const segmentDuration = segmentDurations[currentSegmentIndex] || duration
  const newTime = percentage * segmentDuration

  audioRef.current.currentTime = newTime
}
```

#### 2.3 App.tsx の修正

**ファイル**: `frontend/src/App.tsx`

```typescript
const [audioSegments, setAudioSegments] = useState<Blob[]>([])
const [segmentDurations, setSegmentDurations] = useState<number[]>([])

const handleGenerateAudio = async () => {
  // ... existing validation

  try {
    setIsGenerating(true)
    setError(null)

    // Use separated audio mode
    const { audioBlobs, durations, totalDuration } = await performTTSSeparated(
      ocrText,
      ocrSentences,
      'nova',
      'mp3'
    )

    setAudioSegments(audioBlobs)
    setSegmentDurations(durations)
    setAudioUrl('separated') // Flag to indicate separated mode

    console.log(`[App] Generated ${audioBlobs.length} audio segments, total: ${totalDuration}s`)
  } catch (err) {
    // ... error handling
  } finally {
    setIsGenerating(false)
  }
}

// Pass to AudioPlayer
<AudioPlayer
  audioUrl={audioUrl}
  audioSegments={audioSegments}
  segmentDurations={segmentDurations}
  sourceSentences={ocrSentences}
  // ... other props
/>
```

---

### Phase 3: テスト計画（30-45分）

#### 3.1 バックエンドテスト

**手動テスト**:

```bash
# Start backend
cd backend
python -m uvicorn app.main:app --reload

# Test endpoint with curl
curl -X POST http://localhost:8000/api/tts-with-timings-separated \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello. How are you? I am fine.",
    "sentences": ["Hello.", "How are you?", "I am fine."],
    "voice": "nova",
    "format": "mp3"
  }'
```

**期待されるレスポンス**:

```json
{
  "audio_segments": [
    {
      "index": 0,
      "audio_base64": "base64_string...",
      "text": "Hello.",
      "duration": 0.5
    },
    {
      "index": 1,
      "audio_base64": "base64_string...",
      "text": "How are you?",
      "duration": 0.8
    },
    {
      "index": 2,
      "audio_base64": "base64_string...",
      "text": "I am fine.",
      "duration": 0.7
    }
  ],
  "total_duration": 2.0,
  "format": "mp3"
}
```

#### 3.2 フロントエンドテスト

**テストシナリオ**:

1. **基本再生**
   - [ ] 文0から再生開始
   - [ ] 文0終了後、自動で文1へ移動
   - [ ] 全文再生後、停止

2. **リピート機能**
   - [ ] リピート3回設定 → 文0が3回再生される
   - [ ] リピートカウンター表示（1/3, 2/3, 3/3）
   - [ ] 3回再生後、文1へ自動移動

3. **文ナビゲーション**
   - [ ] 「前の文」ボタン → 文が戻る
   - [ ] 「次の文」ボタン → 文が進む
   - [ ] 文0で「前の文」押下 → 何も起こらない
   - [ ] 最終文で「次の文」押下 → 何も起こらない

4. **ポーズ機能**
   - [ ] ポーズ1秒設定 → 文終了後1秒待ってから次の文
   - [ ] ポーズ中に「次の文」ボタン → すぐに次の文へ

5. **速度調整**
   - [ ] 0.5x, 1.0x, 1.5x, 2.0x で再生
   - [ ] 速度変更後も文切り替えが正常

6. **文リストとの連携**
   - [ ] 文リストで文3をクリック → 文3から再生開始
   - [ ] 再生中、現在の文がハイライト

7. **エラーハンドリング**
   - [ ] ネットワークエラー時のエラー表示
   - [ ] 音声読み込み失敗時の処理

---

## 📊 パフォーマンス比較

### 転送量の比較

**10文のテキストの場合**:

| 方式 | ファイル数 | 総サイズ（推定） | 初回読み込み | 備考 |
|------|----------|----------------|------------|------|
| 結合方式 | 1 | 50KB | 50KB | 1つの大きなファイル |
| 分割方式 | 10 | 55KB | 5KB × 10 | gzip圧縮で軽減可能 |

**メモリ使用量**:
- 結合方式: 1つの`<audio>`要素
- 分割方式: 1つの`<audio>`要素（srcを切り替えるだけ）
- **結論**: メモリ使用量はほぼ同じ

### API料金の比較

**重要**: 既存実装では既に文ごとに生成しているため、**料金は全く増えません**。

---

## 🚀 実装順序

### セッション1（1-1.5時間）: バックエンド実装

1. `openai_service.py`に`generate_speech_separated()`追加（20分）
2. `tts.py`に`/tts-with-timings-separated`エンドポイント追加（15分）
3. `schemas/tts.py`にレスポンススキーマ追加（5分）
4. バックエンドテスト（curlで動作確認）（15分）

### セッション2（1.5時間）: フロントエンド実装（基本）

1. `api/tts.ts`に`performTTSSeparated()`追加（15分）
2. `constants/api.ts`にエンドポイント追加（5分）
3. `App.tsx`の修正（separated mode対応）（20分）
4. `AudioPlayer.tsx`の基本実装（state、初期化、文切り替え）（50分）

### セッション3（1時間）: フロントエンド実装（完成）

1. `AudioPlayer.tsx`のリピート機能実装（20分）
2. `AudioPlayer.tsx`のナビゲーション機能実装（15分）
3. `AudioPlayer.tsx`のポーズ機能実装（15分）
4. UIの調整（シークバー簡略化、文リスト連携）（10分）

### セッション4（30分）: 統合テスト

1. デスクトップでE2Eテスト（15分）
2. モバイルでE2Eテスト（15分）
3. バグ修正（必要に応じて）

---

## 🔄 互換性と移行戦略

### 段階的移行

**Phase A: 両方式をサポート**（現フェーズ）
- 既存の`/api/tts-with-timings`（結合方式）を残す
- 新しい`/api/tts-with-timings-separated`（分割方式）を追加
- フロントエンドで切り替え可能にする

**Phase B: デフォルトを分割方式に変更**
- `App.tsx`で`performTTSSeparated()`をデフォルトに
- 問題があれば`performTTSWithTimings()`に戻せる

**Phase C: 結合方式を削除**（オプション）
- 分割方式が安定したら、結合方式のコードを削除

### フィーチャーフラグ（オプション）

```typescript
// App.tsx
const USE_SEPARATED_AUDIO = true // Toggle between modes

const handleGenerateAudio = async () => {
  if (USE_SEPARATED_AUDIO) {
    // Use separated mode
    const { audioBlobs, durations } = await performTTSSeparated(...)
    setAudioSegments(audioBlobs)
  } else {
    // Use combined mode (legacy)
    const { audioBlob, timings } = await performTTSWithTimings(...)
    setAudioUrl(URL.createObjectURL(audioBlob))
  }
}
```

---

## 🐛 既知の制約と対策

### 制約1: ブラウザの並行音声読み込み制限

**問題**: 10個のmp3を一度に読み込むと、ブラウザの並行リクエスト数制限に引っかかる可能性

**対策**:
- プリロード戦略: 次の文のみを事前読み込み
- 現在の文 + 次の1-2文をバッファリング

```typescript
// Preload next segment
useEffect(() => {
  if (currentSegmentIndex < audioSegments.length - 1) {
    const nextAudio = new Audio(audioSegments[currentSegmentIndex + 1])
    nextAudio.preload = 'auto'
  }
}, [currentSegmentIndex, audioSegments])
```

### 制約2: 文切り替え時の一瞬の無音

**問題**: `audio.src`を変更すると、一瞬の無音が発生する可能性

**対策**:
- `audio.load()`の高速化（プリロード済みなら即座に再生）
- 無音期間を0.05秒未満に抑える

**検証**: 実装後、実際の無音期間を測定

---

## ✅ 成功基準

### 必須要件

1. **リピート機能が完璧に動作**
   - 3回設定で確実に3回再生される
   - カウンター表示が正確

2. **文ナビゲーションが即座に反応**
   - 「次の文」ボタンで即座に移動
   - シーク操作なし（ファイル切り替えのみ）

3. **ポーズ前の音被り問題が完全解決**
   - ポーズ時に次の文の音が聞こえない

4. **API料金が増えない**
   - 既存と同じAPI呼び出し回数

### パフォーマンス要件

1. **文切り替え速度 < 0.1秒**
   - プリロード済みの場合

2. **初回読み込み時間 < 5秒**
   - 10文の場合

3. **メモリ使用量 < 既存の1.2倍**

---

## 📝 次のステップ

### このセッションで実施

1. ✅ 設計書作成（完了）
2. 🔄 ユーザー承認待ち

### 次回セッション（ユーザー承認後）

1. バックエンド実装（30-45分）
2. バックエンドテスト（15分）
3. フロントエンド実装開始（1時間）

---

## 🔗 参考ファイル

**バックエンド**:
- `backend/app/services/openai_service.py` (lines 173-329)
- `backend/app/api/routes/tts.py` (lines 98-190)
- `backend/app/schemas/tts.py`

**フロントエンド**:
- `frontend/src/services/api/tts.ts`
- `frontend/src/components/features/AudioPlayer/AudioPlayer.tsx`
- `frontend/src/App.tsx`

**ドキュメント**:
- `docs/sessions/HANDOVER.md` (Session #17)
- `docs/sessions/TODO.md`
