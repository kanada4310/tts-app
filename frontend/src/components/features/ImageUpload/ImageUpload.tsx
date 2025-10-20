/**
 * ImageUpload Component
 *
 * Handles image file selection, validation, compression, and OCR processing
 */

import { useState, useRef } from 'react'
import { validateImageFile, compressImage, dataUrlToBase64 } from '@/services/image/compression'
import { performOCR, performOCRMultiple } from '@/services/api/ocr'
import type { OCRResponse } from '@/types/api'
import './styles.css'

export interface ImageUploadProps {
  onOCRComplete: (result: OCRResponse, imageDataUrls: string[]) => void
  onError: (error: string) => void
}

export function ImageUpload({ onOCRComplete, onError }: ImageUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [previews, setPreviews] = useState<string[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: File[]) => {
    // Validate maximum number of files
    if (files.length > 10) {
      onError('Maximum 10 images allowed')
      return
    }

    if (files.length === 0) {
      return
    }

    setIsProcessing(true)
    setUploadProgress(`Processing ${files.length} image(s)...`)

    try {
      const compressedImages: string[] = []
      const base64Images: string[] = []

      // Process each image
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Validate file
        const validation = validateImageFile(file)
        if (!validation.valid) {
          onError(`Image ${i + 1}: ${validation.error || 'Invalid file'}`)
          setIsProcessing(false)
          setUploadProgress('')
          return
        }

        setUploadProgress(`Compressing image ${i + 1} of ${files.length}...`)

        // Compress image
        const compressed = await compressImage(file)
        compressedImages.push(compressed.dataUrl)

        // Extract base64 from data URL
        const base64Image = dataUrlToBase64(compressed.dataUrl)
        base64Images.push(base64Image)
      }

      setPreviews(compressedImages)
      setUploadProgress(`Performing OCR on ${files.length} image(s)...`)

      // Perform OCR (single or multiple)
      let ocrResult: OCRResponse
      if (files.length === 1) {
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

      onOCRComplete(ocrResult, compressedImages)
    } catch (error) {
      if (error instanceof Error) {
        onError(error.message)
      } else {
        onError('Failed to process images')
      }
      setPreviews([])
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
            <p>{uploadProgress || 'Processing images...'}</p>
          </div>
        ) : previews.length > 0 ? (
          <div className="preview">
            <div className="preview-grid">
              {previews.map((preview, index) => (
                <img key={index} src={preview} alt={`Preview ${index + 1}`} className="preview-thumbnail" />
              ))}
            </div>
            <p className="hint">
              {previews.length} image(s) uploaded. Click or drop more to replace.
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
            <p className="title">Upload image(s)</p>
            <p className="subtitle">Click or drag and drop</p>
            <p className="info">JPEG or PNG, max 10MB each, up to 10 images</p>
          </div>
        )}
      </div>
    </div>
  )
}
