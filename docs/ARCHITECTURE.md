\# システムアーキテクチャ



\## 全体構成図

```

\[Browser/PWA]

&nbsp;   ↓ HTTPS

\[Frontend (Vercel)]

&nbsp;   ↓ API

\[Backend (Railway)]

&nbsp;   ↓

\[Claude API] \[OpenAI API]

```



\## データフロー



\### 画像→音声の流れ

```

1\. ユーザーが画像アップロード

&nbsp;  ↓

2\. Frontend: 画像圧縮（2000px, 85%)

&nbsp;  ↓

3\. Backend: Claude APIでOCR

&nbsp;  ↓

4\. Frontend: テキスト表示・編集

&nbsp;  ↓

5\. Backend: OpenAI TTSで音声生成

&nbsp;  ↓

6\. Frontend: Tone.jsで速度調整・再生

&nbsp;  ↓

7\. IndexedDBにキャッシュ

```



\## ディレクトリ構成



\### Frontend

```

frontend/

├── src/

│   ├── components/

│   │   ├── ImageUpload.tsx

│   │   ├── TextEditor.tsx

│   │   ├── AudioPlayer.tsx

│   │   └── SpeedControl.tsx

│   ├── services/

│   │   ├── api.ts

│   │   ├── compression.ts

│   │   └── cache.ts

│   ├── hooks/

│   │   ├── useOCR.ts

│   │   └── useTTS.ts

│   └── App.tsx

└── public/

```



\### Backend

```

backend/

├── api/

│   ├── ocr.py

│   └── tts.py

├── services/

│   ├── claude\_service.py

│   └── openai\_service.py

├── utils/

│   └── image\_processing.py

└── main.py

```



\## キャッシュ戦略

\- 音声ファイル: IndexedDB（100MB上限）

\- テキスト: LocalStorage

\- 30日未使用で自動削除



\## セキュリティ

\- HTTPS必須

\- API Keyはサーバーサイドのみ

\- CORS設定

\- レート制限

```



\*\*配置場所\*\*: `docs/ARCHITECTURE.md`



---



\## \*\*📁 推奨ファイル配置\*\*

```

project/

├── README.md                    ★ 必須

├── docs/

│   ├── SPECIFICATION.md         ★ 必須

│   ├── API.md                   ★ 必須

│   └── ARCHITECTURE.md          ★ 必須

├── frontend/

│   └── ...

├── backend/

│   └── ...

└── .env.example                 （環境変数のテンプレート）

```



---



\## \*\*🔄 セッションをまたぐ際の使い方\*\*



\### 新しいセッションでClaude Codeに指示

```

「このプロジェクトの開発を続けます。

まずREADME.mdとdocs/配下のドキュメントを読んで、

プロジェクトの全体像を把握してください。」

