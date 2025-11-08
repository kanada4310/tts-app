import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ImageUpload } from '@/components/features/ImageUpload'
import { TextEditor } from '@/components/features/TextEditor'
import { AudioPlayer } from '@/components/features/AudioPlayer'
import { Tutorial } from '@/components/common/Tutorial'
import { InstallPrompt } from '@/components/common/InstallPrompt'
import { LearningDashboard } from '@/components/features/LearningDashboard'
import { BookmarkList } from '@/components/features/BookmarkList'
import { performTTS, performTTSSeparated, createAudioURL } from '@/services/api/tts'
import { TTS_VOICE, TTS_FORMAT } from '@/constants/audio'
import { MESSAGES } from '@/constants/messages'
import { useLearningSession } from '@/hooks/useLearningSession'
import { useAuth } from '@/hooks/useAuth'
import { needsMigration, migrateToSupabase } from '@/utils/migration'
import type { OCRResponse, SentenceTiming } from '@/types/api'
import './MainPage.css'

const TUTORIAL_STORAGE_KEY = 'tts-app-tutorial-completed'

export function MainPage() {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const [ocrText, setOcrText] = useState('')
  const [ocrSentences, setOcrSentences] = useState<string[]>([])
  const [originalOcrSentences, setOriginalOcrSentences] = useState<string[]>([]) // Store original OCR sentences
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [sentenceTimings, setSentenceTimings] = useState<SentenceTiming[]>([])
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0)
  const [showTutorial, setShowTutorial] = useState(false)

  // Learning features
  const { startSession } = useLearningSession()
  const [showLearningDashboard, setShowLearningDashboard] = useState(false)
  const [showBookmarkList, setShowBookmarkList] = useState(false)

  // Migration features
  const [showMigrationBanner, setShowMigrationBanner] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationProgress, setMigrationProgress] = useState<string>('')
  const [migrationError, setMigrationError] = useState<string | null>(null)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  // Show tutorial on first visit
  useEffect(() => {
    const completed = localStorage.getItem(TUTORIAL_STORAGE_KEY)
    if (!completed) {
      setShowTutorial(true)
    }
  }, [])

  // Check if migration is needed
  useEffect(() => {
    const needsIt = needsMigration()
    if (needsIt) {
      setShowMigrationBanner(true)
    }
  }, [])

  // Separated audio mode (new)
  const [audioSegments, setAudioSegments] = useState<Blob[]>([])
  const [segmentDurations, setSegmentDurations] = useState<number[]>([])

  const handleOCRComplete = (result: OCRResponse, _imageDataUrls: string[]) => {
    const sentences = result.sentences || []
    setOcrText(result.text)
    setOcrSentences(sentences)
    setOriginalOcrSentences(sentences) // Store original OCR sentences
    setError(null)
  }

  const handleTextChange = (newText: string) => {
    setOcrText(newText)

    // If text hasn't changed, keep original OCR sentences (best quality)
    const originalText = originalOcrSentences.join(' ')
    if (newText.trim() === originalText.trim()) {
      setOcrSentences(originalOcrSentences)
      return
    }

    // Text was edited, re-parse sentences
    // Use improved logic similar to backend (Gemini prompt)
    const sentences = newText
      .split(/(?<=[。.!?！？])(?=\s|[A-Z\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF])/) // Split after sentence endings
      .map(s => s.trim())
      .filter(s => s.length > 0)
      // Filter out common abbreviations that shouldn't split
      .reduce((acc: string[], curr) => {
        if (acc.length === 0) {
          return [curr]
        }
        const prev = acc[acc.length - 1]
        // Check if previous sentence ends with common abbreviation
        if (/(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|e\.g|i\.e|U\.S\.A)\.$/.test(prev)) {
          // Merge with previous sentence
          acc[acc.length - 1] = prev + ' ' + curr
          return acc
        }
        return [...acc, curr]
      }, [])

    setOcrSentences(sentences)
  }

  const handleGenerateSpeech = async (text: string) => {
    if (!text.trim()) {
      setError(MESSAGES.ERROR_NO_TEXT)
      return
    }

    setIsGeneratingSpeech(true)
    setError(null)

    try {
      // Revoke previous audio URL to free memory
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }

      // If we have sentences from OCR, use SEPARATED audio mode for perfect timing
      if (ocrSentences && ocrSentences.length > 0) {
        console.log('[App] Using separated audio mode:', ocrSentences.length, 'sentences')

        const { audioBlobs, durations, totalDuration } = await performTTSSeparated(
          text,
          ocrSentences,
          TTS_VOICE,
          TTS_FORMAT
        )

        setAudioSegments(audioBlobs)
        setSegmentDurations(durations)
        setAudioUrl('separated') // Flag to indicate separated mode
        setSentenceTimings([]) // Not used in separated mode

        // Start learning session
        const preview = text.substring(0, 50)
        startSession(preview, ocrSentences.length)

        console.log(`[App] Generated ${audioBlobs.length} audio segments, total: ${totalDuration}s`)
      } else {
        // Fallback to standard TTS without timings
        const audioBlob = await performTTS(text, TTS_VOICE, TTS_FORMAT)
        const newAudioUrl = createAudioURL(audioBlob)
        setAudioUrl(newAudioUrl)
        setAudioSegments([])
        setSegmentDurations([])
        setSentenceTimings([])
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(MESSAGES.ERROR_TTS)
      }
    } finally {
      setIsGeneratingSpeech(false)
    }
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
  }

  // Handle sentence seek from bookmark
  const handleSentenceSeek = (sentenceText: string) => {
    const index = ocrSentences.findIndex((s) => s === sentenceText)
    if (index !== -1) {
      setCurrentSentenceIndex(index)
      setShowBookmarkList(false) // Close bookmark list
    }
  }

  // Handle bookmark play (regenerate audio from bookmark)
  const handleBookmarkPlay = async (materialText: string, materialSentences: string[], sentenceIndex: number) => {
    setShowBookmarkList(false)

    // Reset current states
    if (audioUrl && audioUrl !== 'separated') {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioUrl(null)
    setAudioSegments([])
    setSegmentDurations([])
    setSentenceTimings([])

    // Set OCR data from bookmark
    setOcrText(materialText)
    setOcrSentences(materialSentences)
    setOriginalOcrSentences(materialSentences)

    // Set initial sentence index BEFORE generating audio
    setCurrentSentenceIndex(sentenceIndex)

    // Generate audio directly using the bookmark data
    setIsGeneratingSpeech(true)
    setError(null)

    try {
      // Revoke previous audio URL to free memory
      if (audioUrl && audioUrl !== 'separated') {
        URL.revokeObjectURL(audioUrl)
      }

      console.log('[Bookmark Play] Using separated audio mode:', materialSentences.length, 'sentences')
      console.log('[Bookmark Play] Starting from sentence index:', sentenceIndex)

      const { audioBlobs, durations, totalDuration } = await performTTSSeparated(
        materialText,
        materialSentences,
        TTS_VOICE,
        TTS_FORMAT
      )

      setAudioSegments(audioBlobs)
      setSegmentDurations(durations)
      setAudioUrl('separated') // Flag to indicate separated mode
      setSentenceTimings([]) // Not used in separated mode

      // Start learning session
      const preview = materialText.substring(0, 50)
      startSession(preview, materialSentences.length)

      console.log(`[Bookmark Play] Generated ${audioBlobs.length} audio segments, total: ${totalDuration}s`)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(MESSAGES.ERROR_TTS)
      }
    } finally {
      setIsGeneratingSpeech(false)
    }
  }

  // Handle migration from localStorage to Supabase
  const handleMigrate = async () => {
    setIsMigrating(true)
    setMigrationError(null)
    setMigrationProgress('移行を開始しています...')

    try {
      const result = await migrateToSupabase((progress) => {
        setMigrationProgress(progress)
      })

      if (result.success) {
        setMigrationProgress(
          `✅ 移行完了！教材: ${result.stats.materialsCreated}個、ブックマーク: ${result.stats.bookmarksCreated}個、学習記録: ${result.stats.sessionsCreated}個`
        )
        // Hide banner after 5 seconds
        setTimeout(() => {
          setShowMigrationBanner(false)
        }, 5000)
      } else {
        setMigrationError(`移行に失敗しました: ${result.error}`)
      }
    } catch (error) {
      console.error('[Migration] Error:', error)
      setMigrationError(
        error instanceof Error ? error.message : '移行中に予期しないエラーが発生しました'
      )
    } finally {
      setIsMigrating(false)
    }
  }

  // Dismiss migration banner
  const handleDismissMigration = () => {
    setShowMigrationBanner(false)
  }

  return (
    <div className="app">
      {showTutorial && <Tutorial onComplete={() => setShowTutorial(false)} />}

      <header className="app-header">
        <div className="header-content">
          <div className="header-text">
            <h1>{MESSAGES.APP_TITLE}</h1>
            <p>{MESSAGES.APP_SUBTITLE}</p>
          </div>
          <div className="header-buttons">
            <button
              className="header-button learning-button"
              onClick={() => setShowLearningDashboard(true)}
              title="学習記録を見る"
            >
              <span>📊</span>
              <span className="button-text">学習記録</span>
            </button>
            <button
              className="header-button bookmark-button"
              onClick={() => setShowBookmarkList(true)}
              title="ブックマークを見る"
            >
              <span>⭐</span>
              <span className="button-text">ブックマーク</span>
            </button>
            <button
              className="tutorial-trigger-button"
              onClick={() => setShowTutorial(true)}
              title="使い方を見る"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <circle cx="12" cy="17" r="0.5" fill="currentColor" />
              </svg>
              <span>使い方</span>
            </button>
            <button
              className="header-button logout-button"
              onClick={handleSignOut}
              title="ログアウト"
            >
              <span>🚪</span>
              <span className="button-text">ログアウト</span>
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        {error && (
          <div className="error-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="error-close">
              ×
            </button>
          </div>
        )}

        {/* Migration Banner */}
        {showMigrationBanner && (
          <div className="migration-banner">
            <div className="migration-banner-content">
              <div className="migration-banner-header">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5-5 5 5M12 5v12" />
                </svg>
                <h3>データ移行のお知らせ</h3>
              </div>

              {!isMigrating && !migrationProgress && (
                <>
                  <p className="migration-banner-message">
                    学習データとブックマークをクラウドに移行しますか？
                    <br />
                    移行すると、複数のデバイスでデータを同期できます。
                  </p>
                  <div className="migration-banner-buttons">
                    <button
                      className="migration-button migration-button-primary"
                      onClick={handleMigrate}
                    >
                      今すぐ移行する
                    </button>
                    <button
                      className="migration-button migration-button-secondary"
                      onClick={handleDismissMigration}
                    >
                      後で
                    </button>
                  </div>
                </>
              )}

              {isMigrating && (
                <div className="migration-progress">
                  <div className="migration-spinner"></div>
                  <p>{migrationProgress}</p>
                </div>
              )}

              {migrationProgress && !isMigrating && !migrationError && (
                <div className="migration-success">
                  <p>{migrationProgress}</p>
                </div>
              )}

              {migrationError && (
                <div className="migration-error">
                  <p>❌ {migrationError}</p>
                  <button
                    className="migration-button migration-button-secondary"
                    onClick={handleDismissMigration}
                  >
                    閉じる
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Show AudioPlayer at the top after audio is generated */}
        {audioUrl && (
          <section className="player-section">
            <AudioPlayer
              audioUrl={audioUrl}
              sourceText={ocrText}
              sourceSentences={ocrSentences}
              sentenceTimings={sentenceTimings}
              audioSegments={audioSegments}
              segmentDurations={segmentDurations}
              externalSentenceIndex={currentSentenceIndex}
              onSentenceChange={setCurrentSentenceIndex}
            />
          </section>
        )}

        {/* Show ImageUpload only before audio is generated */}
        {!audioUrl && (
          <section className="upload-section">
            <ImageUpload onOCRComplete={handleOCRComplete} onError={handleError} />
          </section>
        )}

        {/* Show TextEditor only before audio is generated */}
        {ocrText && !audioUrl && (
          <section className="editor-section">
            <TextEditor
              initialText={ocrText}
              onTextChange={handleTextChange}
              onGenerateSpeech={handleGenerateSpeech}
              isGenerating={isGeneratingSpeech}
            />
          </section>
        )}

        {/* SentenceList is now integrated into AudioPlayer */}

        {/* Re-upload button at the bottom after audio is generated */}
        {audioUrl && (
          <section className="reupload-section">
            <button
              className="reupload-button"
              onClick={() => {
                // Reset all states
                if (audioUrl && audioUrl !== 'separated') {
                  URL.revokeObjectURL(audioUrl)
                }
                setAudioUrl(null)
                setOcrText('')
                setOcrSentences([])
                setOriginalOcrSentences([])
                setSentenceTimings([])
                setAudioSegments([])
                setSegmentDurations([])
                setCurrentSentenceIndex(0)
                setError(null)
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              新しい画像をアップロード
            </button>
          </section>
        )}
      </main>

      <InstallPrompt />

      {/* Learning Modals */}
      {showLearningDashboard && (
        <LearningDashboard onClose={() => setShowLearningDashboard(false)} />
      )}

      {showBookmarkList && (
        <BookmarkList
          onClose={() => setShowBookmarkList(false)}
          onSentenceSeek={handleSentenceSeek}
          onBookmarkPlay={handleBookmarkPlay}
        />
      )}
    </div>
  )
}
