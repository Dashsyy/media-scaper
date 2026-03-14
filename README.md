# Media Scraper

Offline helper for collecting and downloading Facebook reels/videos. The UI guides users to collect URLs via an improved console script, analyzes metadata with `yt-dlp`, and downloads selected items with live progress.

## Key Features
- **Interactive User Tour:** Guided step-by-step walkthrough for new users (English & Khmer).
- **Collapsible Quick Guide:** Persistent "How to Use" section at the top of the app.
- **Improved Console Script:** Now includes automatic copy-to-clipboard for collected JSON results.
- **Visual Feedback:** Real-time "Copied!" notifications and button animations.
- **Plug-and-Play Docker:** Self-configuring container that works on any IP/hostname using relative paths.
- **Download History:** PostgreSQL-backed history with thumbnails and local folder reveal.
- **SSE Progress:** Live download updates with status, speed, and percentages.

## Requirements
- Node.js 20+
- `yt-dlp` and `ffmpeg` installed and available in PATH (if running locally).
- Docker & Docker Compose (recommended for easy setup).

## Setup & Running (Docker - Recommended)

Build and run the entire stack:
```bash
docker compose up --build
```

Access the app at:
- `http://localhost:4000`
- `http://<your-machine-ip>:4000`
- `http://<hostname>.local:4000`

## Local Setup

### Backend:
1. `cd backend`
2. `npm install`
3. `cp .env.example .env` (Set `DATABASE_URL` and `DEFAULT_OUTPUT_DIR`)
4. `npm run dev`

### Frontend:
1. `cd frontend`
2. `npm install`
3. `npm run dev` (API requests are proxied to `localhost:4000` automatically)

## How to Use
1. **Open the App:** Follow the interactive tour if it's your first time.
2. **Copy Script:** Click the "Copy script" button in the Quick Guide.
3. **Collect on FB:** Open Facebook Reels/Videos, scroll to load, open Console (F12), and paste.
4. **Paste & Analyze:** Return to the app, paste the JSON, and click "Analyze".
5. **Download:** Select videos and monitor progress in the streaming dashboard.

## Technical Notes
- **Frontend:** React + Vite + Tailwind CSS + i18next + Radix UI.
- **Backend:** Node.js + Express + Drizzle ORM + PostgreSQL.
- **CLI Tools:** `yt-dlp` for metadata and downloading; `ffmpeg` for post-processing.
- **API:** Relative pathing allows deployment without environment variable "baking".
