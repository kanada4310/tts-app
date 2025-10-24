import { useState } from 'react'
import { ImageUpload } from '@/components/features/ImageUpload'
import { TextEditor } from '@/components/features/TextEditor'
import { AudioPlayer } from '@/components/features/AudioPlayer'
import { SentenceList } from '@/components/features/SentenceList'
import { Tutorial } from '@/components/common/Tutorial'
import { performTTS, performTTSWithTimings, performTTSSeparated, createAudioURL } from '@/services/api/tts'
import { TTS_VOICE, TTS_FORMAT } from '@/constants/audio'
import { MESSAGES } from '@/constants/messages'
import type { OCRResponse, SentenceTiming } from '@/types/api'
import './App.css'

function App() {
  const [ocrText, setOcrText] = useState('')
  const [ocrSentences, setOcrSentences] = useState<string[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [sentenceTimings, setSentenceTimings] = useState<SentenceTiming[]>([])
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  // Separated audio mode (new)
  const [audioSegments, setAudioSegments] = useState<Blob[]>([])
  const [segmentDurations, setSegmentDurations] = useState<number[]>([])

  const handleOCRComplete = (result: OCRResponse, imageDataUrls: string[]) => {
    setOcrText(result.text)
    setOcrSentences(result.sentences || [])
    setImagePreviews(imageDataUrls)
    setError(null)
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

  // Callback function for sentence seek - will be called by SentenceList
  const handleSentenceSeekRequest = (index: number) => {
    setCurrentSentenceIndex(index)
  }

  return (
    <div className="app">
      <Tutorial />

      <header className="app-header">
        <h1>{MESSAGES.APP_TITLE}</h1>
        <p>{MESSAGES.APP_SUBTITLE}</p>
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

        <section className="upload-section">
          <ImageUpload onOCRComplete={handleOCRComplete} onError={handleError} />
        </section>

        {/* Show TextEditor only before audio is generated */}
        {ocrText && !audioUrl && (
          <section className="editor-section">
            <TextEditor
              initialText={ocrText}
              onGenerateSpeech={handleGenerateSpeech}
              isGenerating={isGeneratingSpeech}
            />
          </section>
        )}

        {/* Show AudioPlayer after audio is generated */}
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
              onPlayStateChange={setIsPlaying}
            />
          </section>
        )}

        {/* Show SentenceList after audio is generated */}
        {audioUrl && ocrSentences.length > 0 && (
          <section className="sentence-list-section">
            <SentenceList
              sentences={ocrSentences}
              sentenceTimings={sentenceTimings}
              currentSentenceIndex={currentSentenceIndex}
              isPlaying={isPlaying}
              onSentenceClick={handleSentenceSeekRequest}
            />
          </section>
        )}

        {!ocrText && imagePreviews.length === 0 && (
          <div className="welcome-message">
            <h2>{MESSAGES.WELCOME_TITLE}</h2>
            <p>{MESSAGES.WELCOME_DESCRIPTION}</p>
            <div className="features">
              <div className="feature">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                <h3>{MESSAGES.FEATURE_UPLOAD_TITLE}</h3>
                <p>{MESSAGES.FEATURE_UPLOAD_DESC}</p>
              </div>
              <div className="feature">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <h3>{MESSAGES.FEATURE_EXTRACT_TITLE}</h3>
                <p>{MESSAGES.FEATURE_EXTRACT_DESC}</p>
              </div>
              <div className="feature">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18V5l12-2v13M6 15v8M15 16v5" />
                  <circle cx="6" cy="21" r="2" />
                  <circle cx="15" cy="19" r="2" />
                </svg>
                <h3>{MESSAGES.FEATURE_GENERATE_TITLE}</h3>
                <p>{MESSAGES.FEATURE_GENERATE_DESC}</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>{MESSAGES.FOOTER_POWERED_BY}</p>
      </footer>
    </div>
  )
}

export default App
