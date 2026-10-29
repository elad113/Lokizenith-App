# Lokizenith AI

Independent source code for Lokizenith AI. This repository contains the React/Vite frontend and a standalone Node.js/Express API server. It does not require a hosted app-builder platform.

## Requirements
- Node.js 20 or newer
- An API key from Google Gemini, Groq, OpenRouter, or another OpenAI-compatible provider

## Run locally

```bash
npm install
cp .env.example .env
npm run server
```

In another terminal run `npm run dev` and open the local Vite URL. The frontend proxies `/api` requests to the API server on port 8787.

## Production build

```bash
npm install
npm run build
npm start
```

The Express server serves the built `dist/` directory and the API from the same origin. Set `PORT` if needed.

## Built-in OpenRouter for Android

The Android app now uses OpenRouter by default and no longer shows an API & connection settings page. The OpenRouter credential must stay on the server; it is intentionally not embedded in the APK or committed to this public repository.

1. In Render, choose **New → Blueprint** and connect this repository. Render reads `render.yaml` and creates the `lokizenith-ai-api` service.
2. When prompted, enter a **newly rotated** OpenRouter key for the `OPENROUTER_API_KEY` secret. Do not reuse a key that has been pasted into a chat or committed to source.
3. Wait for the service to become live, then check `https://lokizenith-ai-api.onrender.com/api/health` for JSON containing `"ok": true`.
4. The Android app is configured to use that service URL automatically. No API key or backend URL needs to be entered in the app.

Render's free service may take a little longer to respond after sleeping. Never commit real API keys or `.env` files.

## Included
- Lokizenith 3.2 Ostring and 3.5 Feranite chat personalities
- Chat history and preferences saved locally
- Groq, OpenRouter, Gemini, and custom OpenAI-compatible APIs
- Web search and source links when requested by the advanced model
- Image generation through supported Gemini image models
- LokiCode editor, image/file attachments, interactive quizzes, and PowerPoint export
- Responsive emerald interface and Lokizenith app icon

All source files are editable in this repository. To change the interface, edit `src/App.tsx` and `src/index.css`; API behavior lives in `backend/index.ts`.
