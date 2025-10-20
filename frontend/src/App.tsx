import { useState } from 'react'
import { ImageUpload } from '@/components/features/ImageUpload'
import { TextEditor } from '@/components/features/TextEditor'
import { AudioPlayer } from '@/components/features/AudioPlayer'
import { performTTS, performTTSWithTimings, createAudioURL } from '@/services/api/tts'
import { TTS_VOICE, TTS_FORMAT } from '@/constants/audio'
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

  const handleOCRComplete = (result: OCRResponse, imageDataUrls: string[]) => {
    setOcrText(result.text)
    setOcrSentences(result.sentences || [])
    setImagePreviews(imageDataUrls)
    setError(null)
  }

  const handleGenerateSpeech = async (text: string) => {
    if (!text.trim()) {
      setError('No text to convert to speech')
      return
    }

    setIsGeneratingSpeech(true)
    setError(null)

    try {
      // Revoke previous audio URL to free memory
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }

      // If we have sentences from OCR, use TTS with timings for precise pause placement
      if (ocrSentences && ocrSentences.length > 0) {
        const { audioBlob, timings } = await performTTSWithTimings(
          text,
          ocrSentences,
          TTS_VOICE,
          TTS_FORMAT
        )
        const newAudioUrl = createAudioURL(audioBlob)
        setAudioUrl(newAudioUrl)
        setSentenceTimings(timings.sentence_timings)
      } else {
        // Fallback to standard TTS without timings
        const audioBlob = await performTTS(text, TTS_VOICE, TTS_FORMAT)
        const newAudioUrl = createAudioURL(audioBlob)
        setAudioUrl(newAudioUrl)
        setSentenceTimings([])
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to generate speech')
      }
    } finally {
      setIsGeneratingSpeech(false)
    }
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>TTS App</h1>
        <p>OCR and Text-to-Speech Application</p>
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

        {ocrText && (
          <section className="editor-section">
            <TextEditor
              initialText={ocrText}
              onGenerateSpeech={handleGenerateSpeech}
              isGenerating={isGeneratingSpeech}
            />
          </section>
        )}

        {audioUrl && (
          <section className="player-section">
            <AudioPlayer
              audioUrl={audioUrl}
              sourceText={ocrText}
              sourceSentences={ocrSentences}
              sentenceTimings={sentenceTimings}
            />
          </section>
        )}

        {!ocrText && imagePreviews.length === 0 && (
          <div className="welcome-message">
            <h2>Welcome!</h2>
            <p>Upload image(s) to extract text and convert it to speech</p>
            <div className="features">
              <div className="feature">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                <h3>Upload Image(s)</h3>
                <p>JPEG or PNG, up to 10MB each, max 10 images</p>
              </div>
              <div className="feature">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <h3>Extract Text</h3>
                <p>Powered by Gemini AI</p>
              </div>
              <div className="feature">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18V5l12-2v13M6 15v8M15 16v5" />
                  <circle cx="6" cy="21" r="2" />
                  <circle cx="15" cy="19" r="2" />
                </svg>
                <h3>Generate Speech</h3>
                <p>High-quality TTS with speed control</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Powered by Gemini AI and OpenAI TTS</p>
      </footer>
    </div>
  )
}

export default App
