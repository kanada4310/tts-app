/**
 * Image Processing Constants
 */

export const IMAGE_CONFIG = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB in bytes
  MAX_DIMENSION: 2000, // px
  COMPRESSION_QUALITY: 0.85, // 85%
  ALLOWED_TYPES: ['image/jpeg', 'image/png'],
  DEFAULT_FORMAT: 'image/jpeg' as const,
} as const
