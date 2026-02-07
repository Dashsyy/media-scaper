# Media Scraper

Offline helper for collecting and downloading Facebook reels/videos. The UI guides users to collect URLs via a console script, analyzes metadata with `yt-dlp`, and downloads selected items with live progress.

## Features
- Console script to collect reel/video URLs (no cookies required).
- Analyze URLs with `yt-dlp` metadata.
- Download queue with progress updates, cancel, and retry.
- Download history stored in SQLite with thumbnails and timestamps.
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

Or build/run the image directly:
```bash
docker build -t media-scraper:0.1.0 .
docker run --rm -p 4000:4000 \
  -e PORT=4000 \
  -e DATABASE_URL=/app/data/dev.db \
  -e DEFAULT_OUTPUT_DIR=/app/downloads \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/downloads:/app/downloads \
  media-scraper:0.1.0
```

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
- This project uses SQLite for history tracking.
- Jobs are in-memory (not persisted across restarts).
