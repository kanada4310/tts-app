# TTS Frontend

React + TypeScript + Vite PWA application for OCR and Text-to-Speech

## Setup

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
# Edit .env if needed
```

### 3. Run development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
frontend/src/
├── components/
│   ├── features/          # Feature-specific components
│   │   ├── ImageUpload/
│   │   ├── TextEditor/
│   │   ├── AudioPlayer/
│   │   └── RepeatControl/
│   ├── common/            # Reusable components
│   └── layouts/           # Layout components
├── hooks/                 # Custom React hooks
│   ├── api/               # API hooks
│   ├── audio/             # Audio hooks
│   └── storage/           # Storage hooks
├── services/              # Service layer
│   ├── api/               # API clients
│   ├── audio/             # Audio processing
│   ├── image/             # Image processing
│   └── storage/           # Storage (IndexedDB)
├── types/                 # TypeScript types
├── constants/             # Constants
├── utils/                 # Utility functions
└── contexts/              # React contexts
```

## Features

- Image upload and compression
- OCR using Claude API
- TTS using OpenAI API
- Speed-adjustable audio playback (0.5x - 1.25x)
- Sentence-by-sentence repeat
- Pause control (1-5 seconds)
- IndexedDB caching
- PWA support

## Tech Stack

- React 18
- TypeScript
- Vite
- Tone.js (audio processing)
- PWA
