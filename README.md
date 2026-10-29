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

## API key setup

You can enter your provider and key in Settings → API & connection. Those settings are saved in this browser profile so they remain after refresh. Do not use that option on shared devices. Alternatively, set a server-side key in `.env`:

- `LOKIZENITH_GEMINI_API_KEY`
- `LOKIZENITH_CUSTOM_API_KEY`
- `LOKIZENITH_API_KEY`

Provider settings in the app take precedence over server-side fallback keys. Never commit `.env` or real API keys.

## Included
- Lokizenith 3.2 Ostring and 3.5 Feranite chat personalities
- Chat history and preferences saved locally
- Groq, OpenRouter, Gemini, and custom OpenAI-compatible APIs
- Web search and source links when requested by the advanced model
- Image generation through supported Gemini image models
- LokiCode editor, image/file attachments, interactive quizzes, and PowerPoint export
- Responsive emerald interface and Lokizenith app icon

All source files are editable in this repository. To change the interface, edit `src/App.tsx` and `src/index.css`; API behavior lives in `backend/index.ts`.
