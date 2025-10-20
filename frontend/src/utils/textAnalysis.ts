/**
 * Text Analysis Utilities
 *
 * Functions for analyzing text structure, detecting sentence boundaries,
 * and extracting text segments for audio navigation.
 */

export interface Sentence {
  text: string
  startIndex: number
  endIndex: number
}

/**
 * Detects sentence boundaries in text
 * Handles multiple sentence-ending punctuation marks: . ! ? 。 ! ?
 * Improved to avoid false positives (e.g., commas, semicolons, abbreviations)
 *
 * @param text - The input text to analyze
 * @returns Array of sentence objects with text and position information
 */
export function detectSentences(text: string): Sentence[] {
  if (!text || text.trim().length === 0) {
    return []
  }

  const sentences: Sentence[] = []

  // Improved regex to match proper sentence endings:
  // - Sentence-ending punctuation: . ! ? 。 ! ?
  // - Must be followed by: whitespace + capital letter, OR multiple spaces, OR end of string
  // - Excludes: Mr. Mrs. Dr. etc. (common abbreviations)
  // - Excludes: numbers like 3.14
  const sentenceEndRegex = /([.!?。!?]+)(?=\s+[A-Z\u4E00-\u9FFF]|\s{2,}|$)(?!\s*[a-z])/g

  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = sentenceEndRegex.exec(text)) !== null) {
    const endIndex = match.index + match[0].length

    // Skip if this looks like an abbreviation (e.g., "Mr.")
    const precedingText = text.slice(Math.max(0, match.index - 10), match.index)
    if (/\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|e\.g|i\.e)$/i.test(precedingText)) {
      continue
    }

    const sentenceText = text.slice(lastIndex, endIndex).trim()

    if (sentenceText.length > 0) {
      sentences.push({
        text: sentenceText,
        startIndex: lastIndex,
        endIndex: endIndex
      })
    }

    lastIndex = endIndex
  }

  // Handle remaining text if no sentence-ending punctuation at the end
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex).trim()
    if (remainingText.length > 0) {
      sentences.push({
        text: remainingText,
        startIndex: lastIndex,
        endIndex: text.length
      })
    }
  }

  return sentences
}

/**
 * Extracts the first N words from a sentence for tooltip display
 *
 * @param sentence - The sentence text
 * @param wordCount - Number of words to extract (default: 7)
 * @returns First N words, with ellipsis if truncated
 */
export function extractFirstWords(sentence: string, wordCount: number = 7): string {
  const words = sentence.trim().split(/\s+/)

  if (words.length <= wordCount) {
    return sentence.trim()
  }

  return words.slice(0, wordCount).join(' ') + '...'
}

/**
 * Calculates the character position as a percentage of total text length
 *
 * @param charIndex - Character index in the text
 * @param totalLength - Total text length
 * @returns Percentage (0-100)
 */
export function charIndexToPercentage(charIndex: number, totalLength: number): number {
  if (totalLength === 0) return 0
  return (charIndex / totalLength) * 100
}

/**
 * Estimates audio timestamp for a character position
 * Based on average reading speed and audio duration
 *
 * @param charIndex - Character index in the text
 * @param totalLength - Total text length
 * @param audioDuration - Total audio duration in seconds
 * @returns Estimated timestamp in seconds
 */
export function estimateTimestamp(
  charIndex: number,
  totalLength: number,
  audioDuration: number
): number {
  if (totalLength === 0 || audioDuration === 0) return 0
  return (charIndex / totalLength) * audioDuration
}
