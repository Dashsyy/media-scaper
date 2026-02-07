# Media Scraper Agent Notes

## Overview
- Frontend: React + Vite + Tailwind + i18n (en/km).
- Backend: Node.js + Express + PostgreSQL (Drizzle-ready) + SSE.
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
- Optional: `DOWNLOAD_CONCURRENCY` controls parallel downloads (default 1).

## Current Capabilities
- Analyze pasted URLs with async jobs + polling.
- Download jobs with progress streaming, cancel, retry, and optional force re-download.
- Download history stored in PostgreSQL.
- Edit and revert analyzed titles before download.
- Download filenames use video ids to avoid long filename errors.
- Reveal download folder via backend endpoint.

## Known Follow-ups
- Persist jobs in PostgreSQL so progress survives restarts.
- Add history cleanup actions (clear, export).
