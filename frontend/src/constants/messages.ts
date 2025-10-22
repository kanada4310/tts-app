/**
 * UI Messages in Japanese
 *
 * Centralized message strings for the application
 * Future: Can be extended for multi-language support
 */

export const MESSAGES = {
  // App Header
  APP_TITLE: '音声読み上げアプリ',
  APP_SUBTITLE: '画像から音声を作成',

  // Welcome Message
  WELCOME_TITLE: 'ようこそ！',
  WELCOME_DESCRIPTION: '画像をアップロードしてテキストを抽出し、音声に変換します',

  // Features
  FEATURE_UPLOAD_TITLE: '画像アップロード',
  FEATURE_UPLOAD_DESC: 'JPEG/PNG形式、最大10MB、10枚まで',
  FEATURE_EXTRACT_TITLE: 'テキスト抽出',
  FEATURE_EXTRACT_DESC: 'Gemini AIによる高精度OCR',
  FEATURE_GENERATE_TITLE: '音声生成',
  FEATURE_GENERATE_DESC: '速度調整可能な高品質TTS',

  // Image Upload
  UPLOAD_BUTTON: '画像をアップロード',
  UPLOAD_PROMPT: 'クリックまたはドラッグ&ドロップ',
  UPLOAD_INFO: 'JPEG/PNG、最大10MB、10枚まで',
  UPLOAD_LIMIT_NOTE: '※ 最大10枚までアップロード可能',
  UPLOAD_PROCESSING: '処理中...',
  UPLOAD_COMPRESSING: '圧縮中',
  UPLOAD_OCR: 'テキスト抽出中',
  UPLOAD_SUCCESS: '枚の画像をアップロードしました。新しい画像で置き換えるには、クリックまたはドロップしてください。',

  // Text Editor
  EDITOR_TITLE: '抽出されたテキスト',
  EDITOR_PLACEHOLDER: 'OCR処理後にテキストがここに表示されます...',
  EDITOR_HINT: '必要に応じて音声生成前にテキストを編集できます',
  EDITOR_CHAR_COUNT: '文字',
  EDITOR_CHAR_LIMIT: '文字数上限',
  EDITOR_CHAR_WARNING: '上限に近づいています',
  EDITOR_CHAR_ERROR: '上限を超えています。音声生成できません。',
  GENERATE_BUTTON: '音声を生成',
  GENERATING: '生成中...',

  // Audio Player
  PLAYER_TITLE: 'オーディオプレイヤー',
  PLAYER_LOADING: '音声を読み込み中...',
  PLAYER_SPEED: '速度',
  PLAYER_SENTENCE: '文目',
  PLAYER_PAUSING: '一時停止中',
  PLAYER_PAUSE_BETWEEN: '文ごとに一時停止',
  PLAYER_PAUSE_DURATION: '秒数',

  // Control Buttons
  BUTTON_PLAY: '再生',
  BUTTON_PAUSE: '一時停止',
  BUTTON_STOP: '停止',
  BUTTON_PREVIOUS: '前の文',
  BUTTON_NEXT: '次の文',

  // Errors
  ERROR_NO_TEXT: '音声に変換するテキストがありません',
  ERROR_IMAGE_PROCESS: '画像の処理に失敗しました',
  ERROR_IMAGE_SIZE: '画像サイズが10MBを超えています',
  ERROR_IMAGE_FORMAT: 'PNG/JPEG形式の画像のみ対応しています',
  ERROR_IMAGE_MAX: '最大10枚までアップロードできます',
  ERROR_OCR: 'テキスト抽出に失敗しました',
  ERROR_TTS: '音声生成に失敗しました',
  ERROR_NETWORK: 'ネットワークエラーが発生しました。インターネット接続を確認してください。',

  // Error Details (for technical errors)
  ERROR_DETAILS: '以下を確認してください',
  ERROR_CHECK_SIZE: '画像サイズが10MB以下か',
  ERROR_CHECK_FORMAT: 'PNG/JPEG形式か',
  ERROR_CHECK_NETWORK: 'インターネット接続が安定しているか',
  ERROR_CHECK_TEXT_LENGTH: 'テキストが100,000文字以内か',

  // Footer
  FOOTER_POWERED_BY: 'Powered by Gemini AI and OpenAI TTS',
} as const

export type MessageKey = keyof typeof MESSAGES
