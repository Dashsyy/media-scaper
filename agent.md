# Media Scraper Agent Notes

## Architecture
- **Frontend:** React + Vite + Tailwind + Radix UI + i18next (en/km). Uses relative API paths for "plug-and-play" deployment.
- **Backend:** Node.js + Express + PostgreSQL (Drizzle) + SSE streaming.
- **Jobs:** In-memory job state (not yet persisted in DB).
- **Tooling:** Integrated with `yt-dlp` (metadata and downloads) and `ffmpeg`.

## Key Features & Components
- `TourOverlay.tsx`: Interactive, spotlight-based step-by-step tour for new users.
- `UsageCard.tsx`: Collapsible, top-level guide with `localStorage` state persistence.
- `AnalyzeFormCard.tsx`: Main input area with an improved console script + "Copied!" feedback logic.
- `ytDlp.ts`: Backend service for spawning and parsing `yt-dlp` child processes.
- `SSE Stream`: `jobsRouter` handles progress updates via Server-Sent Events.

## Docker Integration
- **Zero-Config:** The Docker build is now environment-agnostic. No `VITE_API_URL` is required; the frontend defaults to relative paths.
- **Reliability:** `docker-compose.yml` includes a PostgreSQL healthcheck and the backend features a retry-loop for DB initialization.
- **Port mapping:** Defaults to `4000:4000` for the app and `5433:5432` for the database to avoid local conflicts.

## Localization
- Locales are stored in `frontend/src/locales/en.json` and `km.json`.
- All new UI text should be added to both locale files to maintain consistency.

## Known Follow-ups (Roadmap)
- [ ] Persist analyze/download jobs in PostgreSQL so they survive restarts.
- [ ] Add history cleanup actions (clear single/all, export to JSON).
- [ ] Add optional cookies upload for restricted/private Facebook content.
- [ ] Add SSE stream for the 'Analyze' process to avoid polling.
