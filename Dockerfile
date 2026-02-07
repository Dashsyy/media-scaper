# =========================
# deps (dev + build deps)
# =========================
FROM node:25-bookworm-slim AS deps

WORKDIR /app

# Build tools ONLY for build stage
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
     python3 \
     make \
     g++ \
  && rm -rf /var/lib/apt/lists/*

# Copy manifests
COPY backend/package.json ./backend/package.json
COPY backend/package-lock.json ./backend/package-lock.json
COPY frontend/package.json ./frontend/package.json
COPY frontend/package-lock.json ./frontend/package-lock.json

# Install all deps (dev included)
RUN cd backend && npm ci
RUN cd frontend && npm ci


# =========================
# builder
# =========================
FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY --from=deps /app /app
COPY backend ./backend
COPY frontend ./frontend

RUN cd frontend && npm run build
RUN cd backend && npm run build


# =========================
# runner (no native deps)
# =========================
FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV STATIC_DIR=/app/public

# Runtime-only packages
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
     ca-certificates \
     curl \
     ffmpeg \
     python3 \
  && rm -rf /var/lib/apt/lists/*

RUN curl -L "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp" \
  -o /usr/local/bin/yt-dlp \
  && chmod a+rx /usr/local/bin/yt-dlp

# Copy built output only
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package.json ./backend/package.json
COPY --from=builder /app/backend/package-lock.json ./backend/package-lock.json
COPY --from=builder /app/frontend/dist ./public

# Install PROD deps ONLY
RUN cd backend && npm ci --omit=dev

EXPOSE 4000

CMD ["node", "backend/dist/index.js"]
