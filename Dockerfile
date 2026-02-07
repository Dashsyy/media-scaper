# =========================
# deps
# =========================
FROM node:20-bookworm AS deps

WORKDIR /app

# Build tools needed only if native deps fallback to build
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
     python3 \
     make \
     g++ \
  && rm -rf /var/lib/apt/lists/*

# Copy manifests first for better layer caching
COPY backend/package.json ./backend/package.json
COPY backend/package-lock.json ./backend/package-lock.json
COPY frontend/package.json ./frontend/package.json
COPY frontend/package-lock.json ./frontend/package-lock.json

# Install deps (do NOT force build-from-source)
RUN cd backend && npm ci
RUN cd frontend && npm ci


# =========================
# builder
# =========================
FROM node:20-bookworm AS builder

WORKDIR /app

COPY --from=deps /app /app
COPY backend ./backend
COPY frontend ./frontend

RUN cd frontend && npm run build
RUN cd backend && npm run build


# =========================
# runner
# =========================
FROM node:20-bookworm AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV STATIC_DIR=/app/public

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
     ffmpeg \
     yt-dlp \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package.json ./backend/package.json
COPY --from=builder /app/backend/package-lock.json ./backend/package-lock.json
COPY --from=builder /app/frontend/dist ./public

RUN cd backend && npm ci --omit=dev

EXPOSE 4000

CMD ["node", "backend/dist/index.js"]