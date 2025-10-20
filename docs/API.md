\# API仕様



\## ベースURL

\- 開発: http://localhost:8000

\- 本番: https://api.example.com



\## エンドポイント



\### POST /api/ocr

画像からテキスト抽出



\*\*Request\*\*

```json

{

&nbsp; "image": "base64\_encoded\_image",

&nbsp; "options": {

&nbsp;   "exclude\_annotations": true,

&nbsp;   "language": "en"

&nbsp; }

}

```



\*\*Response\*\*

```json

{

&nbsp; "text": "Writing has never come easily...",

&nbsp; "confidence": "high",

&nbsp; "processing\_time": 2.3

}

```



\*\*Error\*\*

```json

{

&nbsp; "error": "invalid\_image",

&nbsp; "message": "画像形式が不正です"

}

```



\### POST /api/tts

テキストから音声生成



\*\*Request\*\*

```json

{

&nbsp; "text": "Writing has never...",

&nbsp; "voice": "nova",

&nbsp; "format": "opus"

}

```



\*\*Response\*\*

\- Content-Type: audio/opus

\- Binary audio data



\## エラーコード

\- 400: リクエスト不正

\- 429: レート制限

\- 500: サーバーエラー



\## レート制限

\- OCR: 100回/時間/ユーザー

\- TTS: 100回/時間/ユーザー



\## 認証

（将来的に追加予定）

