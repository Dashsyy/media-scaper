# Media Scraper

Offline helper for collecting and downloading Facebook reels/videos. The UI guides users to collect URLs via a console script, analyzes metadata with `yt-dlp`, and downloads selected items with live progress.

## Features
- Console script to collect reel/video URLs (no cookies required).
- Analyze URLs with `yt-dlp` metadata.
- Download queue with progress updates, cancel, and retry.
- Download history stored in PostgreSQL with thumbnails and timestamps.
- English/Khmer UI toggle.

## Requirements
- Node.js 20 LTS (recommended)
- `yt-dlp` installed and available in PATH
- `ffmpeg` (recommended for best format support)

Check `yt-dlp`:
```bash
yt-dlp --version
```

Install `yt-dlp` (macOS):
```bash
brew install yt-dlp
```

## Setup

Backend:
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Ensure a PostgreSQL instance is running and `DATABASE_URL` points to it.

Frontend:
```bash
cd frontend
npm install
npm run dev
```

Optional frontend env:
```
VITE_API_URL=http://localhost:4000
```

## Docker

Build and run with Docker Compose:
```bash
docker compose up --build
```

The Docker image installs `yt-dlp` and `ffmpeg` automatically.
Docker Compose also starts a Postgres service (`postgres:16`) on the same network.

Or build/run the image directly:
```bash
docker build -t media-scraper:0.1.0 .
docker run --rm -p 4000:4000 \
  -e PORT=4000 \
  -e DATABASE_URL=postgres://media_scraper:media_scraper@host.docker.internal:5432/media_scraper \
  -e DEFAULT_OUTPUT_DIR=/app/downloads \
  -v $(pwd)/downloads:/app/downloads \
  media-scraper:0.1.0
```

## Docker Hub Deploy

One-step deploy script (build + tag + push):
```bash
chmod +x scripts/deploy-docker.sh
./scripts/deploy-docker.sh
```

Update `scripts/deploy-docker.sh` if you want a different Docker Hub repo.

## How to Use
1. Open Facebook, go to the page with reels/videos, and scroll to load more.
2. Open DevTools → Console.
3. Copy the console script from the app and paste it into the console.
4. Copy the JSON output and paste it into the “Paste collected URLs” field.
5. Click Analyze, then select items to download.
6. Monitor progress and use Retry/Cancel if needed.

## API Endpoints (Backend)
- `POST /api/analyze` — analyze pasted URLs with `yt-dlp`.
- `POST /api/jobs` — start downloads.
- `POST /api/jobs/:id/cancel` — cancel job.
- `POST /api/jobs/:id/retry` — retry failed items.
- `GET /api/jobs/:id/stream` — SSE progress stream.
- `GET /api/history` — download history.
- `POST /api/system/reveal` — open file or folder.

## Notes
- This project uses PostgreSQL for history tracking.
- Jobs are in-memory (not persisted across restarts).
