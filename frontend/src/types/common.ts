/**
 * Common TypeScript types
 */

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface ErrorInfo {
  code: string
  message: string
}
