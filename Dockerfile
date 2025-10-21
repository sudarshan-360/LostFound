# ===============================
# Multi-stage Dockerfile
# Next.js + Python CLIP service
# Small production-ready
# ===============================

# Stage 1: Build Next.js app
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build Next.js app
ENV NODE_ENV=production
RUN npm run build

# Stage 2: Production runtime
FROM python:3.11-slim AS runner

WORKDIR /app

# Install system dependencies & Node.js
RUN apt-get update && apt-get install -y curl gcc g++ && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --system --gid 1001 nextjs && \
    useradd --system --uid 1001 --gid nextjs --home /home/nextjs --create-home nextjs

# Copy Node.js production dependencies
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built Next.js app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/server.js ./

# Copy Python service and install dependencies
COPY python/clip_service/requirements.txt ./python/clip_service/requirements.txt
RUN pip install --no-cache-dir -r python/clip_service/requirements.txt
COPY python/ ./python/

# Environment variables (set sensitive values at runtime)
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV PYTHON_PORT=8000
ENV HF_HOME=/app/.cache
ENV TRANSFORMERS_CACHE=/app/.cache
ENV HF_DATASETS_CACHE=/app/.cache

# Create cache directory
RUN mkdir -p /app/.cache && chown -R nextjs:nextjs /app /home/nextjs

# Switch to non-root user
USER nextjs

# Expose ports
EXPOSE 3000 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node --version && python3 --version

# Start both services
CMD ["sh", "-c", "python3 -m uvicorn python.clip_service.main:app --host 0.0.0.0 --port 8000 & node server.js"]
