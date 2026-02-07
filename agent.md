# Media Scraper Agent Notes

## Overview
- Frontend: React + Vite + Tailwind + i18n (en/km).
- Backend: Node.js + Express + SQLite (Drizzle-ready) + SSE.
- Integrates with `yt-dlp` for metadata + downloads.

## Modules
- `frontend/`: UI (shadcn-inspired components), i18n, console script helper.
- `backend/`: API routes, SSE streaming, download history, yt-dlp runner.

## Local Commands
- Backend: `npm run dev` in `backend/`.
- Frontend: `npm run dev` in `frontend/`.

## Environment
- `backend/.env` should include `PORT`, `DATABASE_URL`, `DEFAULT_OUTPUT_DIR`.
- `frontend/.env` can set `VITE_API_URL` (defaults to `http://localhost:4000`).

## Current Capabilities
- Analyze pasted URLs with `yt-dlp` metadata extraction.
- Download jobs with progress streaming, cancel, retry.
- Download history stored in SQLite.
- Reveal download folder via backend endpoint.

## Known Follow-ups
- Persist jobs in SQLite so progress survives restarts.
- Add history cleanup actions (clear, export).
