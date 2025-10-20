# TTS Backend

FastAPI backend for OCR and Text-to-Speech API

## Setup

### 1. Create virtual environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment variables

```bash
cp .env.example .env
# Edit .env with your API keys
```

### 4. Run development server

```bash
cd backend
python -m app.main
# Or using uvicorn directly:
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### Health Check
- `GET /` - Root endpoint
- `GET /health` - Health check

### OCR
- `POST /api/ocr` - Extract text from image

### TTS
- `POST /api/tts` - Generate speech from text

## Development

### Run tests

```bash
pytest
```

### Code formatting

```bash
black app/
isort app/
```

### Type checking

```bash
mypy app/
```

## Project Structure

```
backend/
├── app/
│   ├── api/routes/        # API endpoints
│   ├── core/              # Config, constants, errors
│   ├── services/          # External API integrations
│   ├── schemas/           # Pydantic models
│   └── utils/             # Utility functions
├── tests/                 # Test suite
├── requirements.txt       # Production dependencies
└── requirements-dev.txt   # Development dependencies
```

## Environment Variables

See `.env.example` for required configuration.
