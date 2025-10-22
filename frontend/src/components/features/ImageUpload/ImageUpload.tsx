/**
 * ImageUpload Component
 *
 * Handles image file selection, validation, compression, and OCR processing
 */

import { useState, useRef } from 'react'
import { validateImageFile, compressImage, dataUrlToBase64 } from '@/services/image/compression'
import { performOCR, performOCRMultiple } from '@/services/api/ocr'
import { MESSAGES } from '@/constants/messages'
import type { OCRResponse } from '@/types/api'
import './styles.css'

export interface ImageUploadProps {
  onOCRComplete: (result: OCRResponse, imageDataUrls: string[]) => void
  onError: (error: string) => void
}

interface ProcessedImage {
  dataUrl: string
  base64: string
}

const MAX_IMAGES = 10

export function ImageUpload({ onOCRComplete, onError }: ImageUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>('')
  const [showLimitWarning, setShowLimitWarning] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: File[]) => {
    // Show warning and truncate if exceeds limit
    if (files.length > MAX_IMAGES) {
      setShowLimitWarning(true)
      // Only use first MAX_IMAGES files
      files = Array.from(files).slice(0, MAX_IMAGES)
      setTimeout(() => setShowLimitWarning(false), 5000) // Hide after 5 seconds
    }

    if (files.length === 0) {
      return
    }

    setIsProcessing(true)
    setUploadProgress(`${files.length}${MESSAGES.UPLOAD_PROCESSING}`)

    try {
      const newProcessedImages: ProcessedImage[] = []

      // Process each image
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Validate file
        const validation = validateImageFile(file)
        if (!validation.valid) {
          onError(`画像 ${i + 1}: ${validation.error || MESSAGES.ERROR_IMAGE_PROCESS}`)
          setIsProcessing(false)
          setUploadProgress('')
          return
        }

        setUploadProgress(`${MESSAGES.UPLOAD_COMPRESSING} ${i + 1} / ${files.length}...`)

        // Compress image
        const compressed = await compressImage(file)
        const base64Image = dataUrlToBase64(compressed.dataUrl)

        newProcessedImages.push({
          dataUrl: compressed.dataUrl,
          base64: base64Image,
        })
      }

      setProcessedImages(newProcessedImages)
      setUploadProgress(`${files.length}枚の画像を${MESSAGES.UPLOAD_OCR}...`)

      // Perform OCR (single or multiple)
      await performOCRFromProcessedImages(newProcessedImages)
    } catch (error) {
      if (error instanceof Error) {
        onError(error.message)
      } else {
        onError(MESSAGES.ERROR_IMAGE_PROCESS)
      }
      setProcessedImages([])
    } finally {
      setIsProcessing(false)
      setUploadProgress('')
    }
  }

  const performOCRFromProcessedImages = async (images: ProcessedImage[]) => {
    const base64Images = images.map(img => img.base64)
    const dataUrls = images.map(img => img.dataUrl)

    let ocrResult: OCRResponse
    if (images.length === 1) {
      ocrResult = await performOCR(base64Images[0], {
        exclude_annotations: true,
        language: 'auto',
      })
    } else {
      ocrResult = await performOCRMultiple(base64Images, {
        exclude_annotations: true,
        language: 'auto',
        page_separator: '\n\n',
      })
    }

    onOCRComplete(ocrResult, dataUrls)
  }

  const handleDeleteImage = async (index: number) => {
    const newImages = processedImages.filter((_, i) => i !== index)
    setProcessedImages(newImages)

    if (newImages.length === 0) {
      // Reset if no images left
      onOCRComplete({
        text: '',
        sentences: [],
        page_count: 0,
        confidence: 'low',
        processing_time: 0
      }, [])
      return
    }

    // Re-run OCR with remaining images
    try {
      setIsProcessing(true)
      setUploadProgress(`${newImages.length}枚の画像を${MESSAGES.UPLOAD_OCR}...`)
      await performOCRFromProcessedImages(newImages)
    } catch (error) {
      if (error instanceof Error) {
        onError(error.message)
      } else {
        onError(MESSAGES.ERROR_IMAGE_PROCESS)
      }
    } finally {
      setIsProcessing(false)
      setUploadProgress('')
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      handleFiles(Array.from(files))
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setDragActive(false)

    const files = event.dataTransfer.files
    if (files && files.length > 0) {
      handleFiles(Array.from(files))
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
      {showLimitWarning && (
        <div className="limit-warning">
          ⚠️ {MESSAGES.ERROR_IMAGE_MAX}。最初の{MAX_IMAGES}枚のみアップロードします。
        </div>
      )}
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
          multiple
          style={{ display: 'none' }}
        />

        {isProcessing ? (
          <div className="upload-status">
            <div className="spinner" />
            <p>{uploadProgress || MESSAGES.UPLOAD_PROCESSING}</p>
          </div>
        ) : processedImages.length > 0 ? (
          <div className="preview">
            <div className="preview-grid">
              {processedImages.map((image, index) => (
                <div key={index} className="preview-item">
                  <img src={image.dataUrl} alt={`Preview ${index + 1}`} className="preview-thumbnail" />
                  <button
                    className="delete-button"
                    onClick={() => handleDeleteImage(index)}
                    title="この画像を削除"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <p className="hint">
              {processedImages.length}{MESSAGES.UPLOAD_SUCCESS}
            </p>
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
            <p className="title">{MESSAGES.UPLOAD_BUTTON}</p>
            <p className="subtitle">{MESSAGES.UPLOAD_PROMPT}</p>
            <p className="info">{MESSAGES.UPLOAD_INFO}</p>
            <p className="limit-note">{MESSAGES.UPLOAD_LIMIT_NOTE}</p>
          </div>
        )}
      </div>
    </div>
  )
}
