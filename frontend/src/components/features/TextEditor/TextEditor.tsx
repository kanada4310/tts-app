/**
 * TextEditor Component
 *
 * Displays and allows editing of OCR-extracted text
 */

import { useState, useEffect } from 'react'
import { MESSAGES } from '@/constants/messages'
import './styles.css'

export interface TextEditorProps {
  initialText: string
  onTextChange?: (text: string) => void
  onGenerateSpeech: (text: string) => void
  isGenerating?: boolean
}

const MAX_CHARS = 100000
const WARNING_THRESHOLD = 90000

export function TextEditor({
  initialText,
  onTextChange,
  onGenerateSpeech,
  isGenerating = false,
}: TextEditorProps) {
  const [text, setText] = useState(initialText)
  const [charCount, setCharCount] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState<number>(0)

  useEffect(() => {
    setText(initialText)
    setCharCount(initialText.length)
  }, [initialText])

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = event.target.value
    setText(newText)
    setCharCount(newText.length)
    onTextChange?.(newText)
  }

  const handleGenerateClick = () => {
    if (text.trim()) {
      // Estimate generation time: roughly 2 seconds per sentence
      const sentenceCount = text.split(/[。.!?]+/).filter(s => s.trim().length > 0).length
      const estimated = Math.max(5, sentenceCount * 2) // Minimum 5 seconds
      setEstimatedTime(estimated)
      onGenerateSpeech(text)
    }
  }

  const canGenerate = text.trim().length > 0 && !isGenerating && charCount <= MAX_CHARS

  // Determine character count color
  const getCharCountClass = () => {
    if (charCount > MAX_CHARS) return 'char-count error'
    if (charCount > WARNING_THRESHOLD) return 'char-count warning'
    return 'char-count'
  }

  const getCharCountMessage = () => {
    if (charCount > MAX_CHARS) return MESSAGES.EDITOR_CHAR_ERROR
    if (charCount > WARNING_THRESHOLD) return MESSAGES.EDITOR_CHAR_WARNING
    return ''
  }

  return (
    <div className="text-editor">
      <div className="editor-header">
        <h3>{MESSAGES.EDITOR_TITLE}</h3>
        <div className="char-info">
          <span className={getCharCountClass()}>
            {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()} {MESSAGES.EDITOR_CHAR_COUNT}
          </span>
          {getCharCountMessage() && (
            <span className="char-message">{getCharCountMessage()}</span>
          )}
        </div>
      </div>

      <textarea
        className="editor-textarea"
        value={text}
        onChange={handleChange}
        placeholder={MESSAGES.EDITOR_PLACEHOLDER}
        disabled={isGenerating}
        rows={10}
      />

      <div className="editor-footer">
        <p className="hint">{MESSAGES.EDITOR_HINT}</p>
        <button
          className="generate-button"
          onClick={handleGenerateClick}
          disabled={!canGenerate}
        >
          {isGenerating ? (
            <>
              <span className="button-spinner" />
              {MESSAGES.GENERATING}
            </>
          ) : (
            MESSAGES.GENERATE_BUTTON
          )}
        </button>
      </div>

      {isGenerating && estimatedTime > 0 && (
        <div className="generation-progress">
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ animation: `fillProgress ${estimatedTime}s linear` }} />
          </div>
          <p className="progress-text">
            音声を生成中... 予想時間: 約{estimatedTime}秒
          </p>
        </div>
      )}
    </div>
  )
}
