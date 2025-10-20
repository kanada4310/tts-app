\# API仕様



\## ベースURL

\- 開発: http://localhost:8000

\- 本番: https://api.example.com



\## エンドポイント



\### POST /api/ocr

画像からテキスト抽出（複数画像対応）



\*\*Request（単一画像）\*\*

```json

{

&nbsp; "image": "base64\_encoded\_image",

&nbsp; "options": {

&nbsp;   "exclude\_annotations": true,

&nbsp;   "language": "en"

&nbsp; }

}

```



\*\*Request（複数画像）\*\*

```json

{

&nbsp; "images": [

&nbsp;   "base64\_encoded\_image\_1",

&nbsp;   "base64\_encoded\_image\_2",

&nbsp;   "base64\_encoded\_image\_3"

&nbsp; ],

&nbsp; "options": {

&nbsp;   "exclude\_annotations": true,

&nbsp;   "language": "en",

&nbsp;   "page\_separator": "\\n\\n"

&nbsp; }

}

```



\*\*Response\*\*

```json

{

&nbsp; "text": "Writing has never come easily...",

&nbsp; "confidence": "high",

&nbsp; "processing\_time": 2.3,

&nbsp; "page\_count": 1

}

```



\*\*Response（複数画像の場合）\*\*

```json

{

&nbsp; "text": "Page 1 text...\\n\\nPage 2 text...\\n\\nPage 3 text...",

&nbsp; "confidence": "high",

&nbsp; "processing\_time": 6.8,

&nbsp; "page\_count": 3

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

