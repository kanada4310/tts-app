/**
 * Tutorial Component
 *
 * Displays a step-by-step tutorial overlay for first-time users
 */

import { useState, useEffect } from 'react'
import './styles.css'

interface TutorialStep {
  title: string
  description: string
  icon: string
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: '1. 画像をアップロード',
    description: '教科書やノートの写真をアップロードしてください。最大10枚まで対応しています。',
    icon: '📷',
  },
  {
    title: '2. テキストを編集',
    description: 'OCRで抽出されたテキストを確認し、必要に応じて編集してください。',
    icon: '✏️',
  },
  {
    title: '3. 音声を生成・再生',
    description: '音声を生成して再生できます。速度調整やポーズ機能も使えます！',
    icon: '🎵',
  },
]

const TUTORIAL_STORAGE_KEY = 'tts-app-tutorial-completed'

export interface TutorialProps {
  onComplete?: () => void
}

export function Tutorial({ onComplete }: TutorialProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    // Check if tutorial has been completed before
    const completed = localStorage.getItem(TUTORIAL_STORAGE_KEY)
    if (!completed) {
      setIsVisible(true)
    }
  }, [])

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true')
    setIsVisible(false)
    onComplete?.()
  }

  if (!isVisible) {
    return null
  }

  const step = TUTORIAL_STEPS[currentStep]
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-content">
        <div className="tutorial-header">
          <h2>音声読み上げアプリへようこそ！</h2>
          <button className="tutorial-skip" onClick={handleSkip}>
            スキップ
          </button>
        </div>

        <div className="tutorial-step">
          <div className="tutorial-icon">{step.icon}</div>
          <h3>{step.title}</h3>
          <p>{step.description}</p>
        </div>

        <div className="tutorial-progress">
          {TUTORIAL_STEPS.map((_, index) => (
            <div
              key={index}
              className={`progress-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
            />
          ))}
        </div>

        <div className="tutorial-footer">
          <button
            className="tutorial-button secondary"
            onClick={handleSkip}
          >
            後で
          </button>
          <button
            className="tutorial-button primary"
            onClick={handleNext}
          >
            {isLastStep ? '始める' : '次へ'}
          </button>
        </div>
      </div>
    </div>
  )
}
