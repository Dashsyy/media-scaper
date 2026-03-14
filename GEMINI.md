# Media Scraper - Project Context

Media Scraper is a full-stack application designed to facilitate the collection and downloading of Facebook reels and videos. It uses a custom console script for URL collection and leverages `yt-dlp` for metadata analysis and downloads.

## Project Overview
- **Frontend:** React-based UI built with Vite and Tailwind CSS. Supports English and Khmer languages via `i18next`.
- **Backend:** Node.js Express server using Drizzle ORM with PostgreSQL for data persistence.
- **Core Functionality:** Analyzes video URLs, manages a download queue with real-time progress updates (SSE), and maintains a download history.
- **Tools:** Requires `yt-dlp` and `ffmpeg` for video processing and format support.

## Architecture
- **Mono-repo Structure:**
  - `frontend/`: React application, UI components (Radix UI), and i18n locales.
  - `backend/`: Express API, Drizzle database schema, and services for job management and `yt-dlp` integration.
  - `scripts/`: Deployment scripts (e.g., Docker Hub deployment).
- **Production Flow:** The frontend is built into a static directory which the backend serves. Both services can be containerized using the provided `Dockerfile` and `docker-compose.yml`.

## Tech Stack
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Radix UI, i18next.
- **Backend:** Node.js, Express, TypeScript, Drizzle ORM, PostgreSQL (`pg`), Zod (validation), `yt-dlp`, `ffmpeg`.
- **Infrastructure:** Docker, Docker Compose.

## Building and Running

### Prerequisites
- Node.js 20+
- `yt-dlp` and `ffmpeg` installed in system PATH.
- PostgreSQL database instance.

### Backend Setup
1. `cd backend`
2. `npm install`
3. Create `.env` from `.env.example` (set `DATABASE_URL` and `DEFAULT_OUTPUT_DIR`).
4. `npm run dev` for development or `npm run build && npm start` for production.
5. Database Migrations: `npm run drizzle:generate` followed by `npm run drizzle:migrate`.

### Frontend Setup
1. `cd frontend`
2. `npm install`
3. Optional: Create `.env` and set `VITE_API_URL` (defaults to `http://localhost:4000`).
4. `npm run dev` for development or `npm run build` for production.

### Docker
- Run the entire stack: `docker compose up --build`
- This automatically handles building both frontend and backend and starts a PostgreSQL container.

## Development Conventions
- **TypeScript:** Required for both frontend and backend. Ensure types are well-defined.
- **Backend Routing:** Routes are modularized in `backend/src/routes/`.
- **Business Logic:** Encapsulated in services within `backend/src/services/` (e.g., `jobStore`, `ytDlp`).
- **State Management:** Backend uses in-memory stores for active jobs; history is persisted in PostgreSQL.
- **API Standards:**
  - `POST /api/analyze`: Metadata extraction.
  - `POST /api/jobs`: Queue management.
  - `GET /api/jobs/:id/stream`: Real-time updates via Server-Sent Events (SSE).
- **Internationalization:** All UI text should be managed through `frontend/src/locales/` (English and Khmer).

## Important Files
- `backend/src/db/schema.ts`: Database schema definition (Drizzle).
- `backend/src/services/ytDlp.ts`: Logic for interacting with the `yt-dlp` CLI.
- `frontend/src/components/AnalyzeFormCard.tsx`: Main interface for URL input.
- `Dockerfile`: Multi-stage build for frontend and backend.
- `agent.md`: Detailed notes for AI agents regarding current capabilities and follow-ups.
- `TODO.md`: Roadmap for future features (e.g., job persistence, history cleanup).
