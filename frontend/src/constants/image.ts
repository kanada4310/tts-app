/**
 * Image Processing Constants
 */

export const IMAGE_CONFIG = {
  MAX_SIZE_MB: 10,
  MAX_DIMENSION: 2000,
  QUALITY: 0.85,
  SUPPORTED_TYPES: ['image/jpeg', 'image/png'] as const,
  OUTPUT_FORMAT: 'image/jpeg' as const,
} as const
