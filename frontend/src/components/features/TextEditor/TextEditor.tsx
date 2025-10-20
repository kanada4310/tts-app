/**
 * TextEditor Component
 *
 * Displays and allows editing of OCR-extracted text
 */

import { useState, useEffect } from 'react'
import './styles.css'

export interface TextEditorProps {
  initialText: string
  onTextChange?: (text: string) => void
  onGenerateSpeech: (text: string) => void
  isGenerating?: boolean
}

export function TextEditor({
  initialText,
  onTextChange,
  onGenerateSpeech,
  isGenerating = false,
}: TextEditorProps) {
  const [text, setText] = useState(initialText)
  const [charCount, setCharCount] = useState(0)

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
      onGenerateSpeech(text)
    }
  }

  const canGenerate = text.trim().length > 0 && !isGenerating

  return (
    <div className="text-editor">
      <div className="editor-header">
        <h3>Extracted Text</h3>
        <span className="char-count">{charCount} characters</span>
      </div>

      <textarea
        className="editor-textarea"
        value={text}
        onChange={handleChange}
        placeholder="Text will appear here after OCR processing..."
        disabled={isGenerating}
        rows={10}
      />

      <div className="editor-footer">
        <p className="hint">Edit the text if needed before generating speech</p>
        <button
          className="generate-button"
          onClick={handleGenerateClick}
          disabled={!canGenerate}
        >
          {isGenerating ? (
            <>
              <span className="button-spinner" />
              Generating...
            </>
          ) : (
            'Generate Speech'
          )}
        </button>
      </div>
    </div>
  )
}
