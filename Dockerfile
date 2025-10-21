# Stage 1: Build Next.js
FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ENV NODE_ENV=production
RUN npm run build

# Stage 2: Python dependencies
FROM python:3.11-slim-bullseye AS python-deps
WORKDIR /app

RUN apt-get update && apt-get install -y gcc g++ curl && rm -rf /var/lib/apt/lists/*

COPY python/clip_service/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Stage 3: Production runtime
FROM python:3.11-slim-bullseye AS runner
WORKDIR /app

# Install Node.js for production
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --system --gid 1001 nextjs && \
    useradd --system --uid 1001 --gid nextjs --create-home /home/nextjs
USER nextjs

# Copy Python dependencies
COPY --from=python-deps /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=python-deps /usr/local/bin /usr/local/bin

# Copy Node production dependencies
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built Next.js app and public folder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/server.js ./

# Copy Python service
COPY python/ ./python/

# Setup cache dirs and permissions
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV PYTHON_PORT=8000
ENV HF_HOME=/app/.cache
ENV TRANSFORMERS_CACHE=/app/.cache
ENV HF_DATASETS_CACHE=/app/.cache
RUN mkdir -p /app/.cache

# Expose ports
EXPOSE 3000 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node --version && python3 --version

# Start services
CMD ["sh", "-c", "python3 -m uvicorn python.clip_service.main:app --host 0.0.0.0 --port 8000 & node server.js"]
