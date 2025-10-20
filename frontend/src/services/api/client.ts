/**
 * API Client Configuration
 */

import { API_BASE_URL, API_TIMEOUT } from '@/constants/api'
import type { APIError } from '@/types/api'

export class APIClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message)
    this.name = 'APIClientError'
  }
}

/**
 * Base fetch wrapper with timeout and error handling
 */
export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

  try {
    const url = `${API_BASE_URL}${endpoint}`
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      await handleErrorResponse(response)
    }

    return await response.json()
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof APIClientError) {
      throw error
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new APIClientError('Request timeout')
      }
      throw new APIClientError(error.message)
    }

    throw new APIClientError('Unknown error occurred')
  }
}

/**
 * Handles error responses from API
 */
async function handleErrorResponse(response: Response): Promise<never> {
  let errorData: APIError | undefined

  try {
    errorData = await response.json()
  } catch {
    // If JSON parsing fails, use status text
  }

  const message = errorData?.message || response.statusText || 'Request failed'

  throw new APIClientError(message, response.status, errorData)
}

/**
 * GET request
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: 'GET',
  })
}

/**
 * POST request
 */
export async function apiPost<T, D = unknown>(
  endpoint: string,
  data: D
): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * POST request for binary data (returns blob)
 */
export async function apiPostBinary(
  endpoint: string,
  data: unknown
): Promise<Blob> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

  try {
    const url = `${API_BASE_URL}${endpoint}`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      await handleErrorResponse(response)
    }

    return await response.blob()
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof APIClientError) {
      throw error
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new APIClientError('Request timeout')
      }
      throw new APIClientError(error.message)
    }

    throw new APIClientError('Unknown error occurred')
  }
}
