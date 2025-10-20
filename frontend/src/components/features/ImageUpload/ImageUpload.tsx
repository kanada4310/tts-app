/**
 * ImageUpload Component
 *
 * Handles image file selection, validation, compression, and OCR processing
 */

import { useState, useRef } from 'react'
import { validateImageFile, compressImage, dataUrlToBase64 } from '@/services/image/compression'
import { performOCR } from '@/services/api/ocr'
import type { OCRResponse } from '@/types/api'
import './styles.css'

export interface ImageUploadProps {
  onOCRComplete: (result: OCRResponse, imageDataUrl: string) => void
  onError: (error: string) => void
}

export function ImageUpload({ onOCRComplete, onError }: ImageUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    // Validate file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      onError(validation.error || 'Invalid file')
      return
    }

    setIsProcessing(true)

    try {
      // Compress image
      const compressed = await compressImage(file)
      setPreview(compressed.dataUrl)

      // Extract base64 from data URL
      const base64Image = dataUrlToBase64(compressed.dataUrl)

      // Perform OCR
      const ocrResult = await performOCR(base64Image, {
        exclude_annotations: true,
        language: 'auto',
      })

      onOCRComplete(ocrResult, compressed.dataUrl)
    } catch (error) {
      if (error instanceof Error) {
        onError(error.message)
      } else {
        onError('Failed to process image')
      }
      setPreview(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setDragActive(false)

    const file = event.dataTransfer.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleDrag = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()

    if (event.type === 'dragenter' || event.type === 'dragover') {
      setDragActive(true)
    } else if (event.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="image-upload">
      <div
        className={`upload-zone ${dragActive ? 'drag-active' : ''} ${isProcessing ? 'processing' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleFileSelect}
          disabled={isProcessing}
          style={{ display: 'none' }}
        />

        {isProcessing ? (
          <div className="upload-status">
            <div className="spinner" />
            <p>Processing image...</p>
          </div>
        ) : preview ? (
          <div className="preview">
            <img src={preview} alt="Preview" />
            <p className="hint">Click or drop another image to replace</p>
          </div>
        ) : (
          <div className="upload-prompt">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            <p className="title">Upload an image</p>
            <p className="subtitle">Click or drag and drop</p>
            <p className="info">JPEG or PNG, max 10MB</p>
          </div>
        )}
      </div>
    </div>
  )
}
