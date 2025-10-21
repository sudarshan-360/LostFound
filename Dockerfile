# Multi-stage Dockerfile for Next.js app with Python CLIP service

# Stage 1: Build the Next.js application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm ci

# Copy source code
COPY . .

# Set environment variables for build
ENV MONGODB_URI=mongodb://localhost:27017/lostfound
ENV NEXTAUTH_SECRET=build-secret-key
ENV NEXTAUTH_URL=http://localhost:3000
ENV CLOUDINARY_CLOUD_NAME=dummy
ENV CLOUDINARY_API_KEY=dummy
ENV CLOUDINARY_API_SECRET=dummy

# Build the application
RUN npm run build

# Stage 2: Python dependencies
FROM python:3.11-slim AS python-deps

WORKDIR /app

# Install system dependencies for PyTorch
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements and install dependencies
COPY python/clip_service/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Stage 3: Production runtime
FROM python:3.11-slim AS runner

WORKDIR /app

# Install Node.js
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user with home directory
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 --gid nodejs --create-home nextjs

# Copy Python dependencies
COPY --from=python-deps /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=python-deps /usr/local/bin /usr/local/bin

# Install Node.js production dependencies
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built Next.js app from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/server.js ./

# Copy Python service
COPY --chown=nextjs:nodejs python/ ./python/

# Set up environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV PYTHON_PORT=8000

# Set HuggingFace cache directory and ensure ownership
ENV HF_HOME=/app/.cache
ENV TRANSFORMERS_CACHE=/app/.cache
ENV HF_DATASETS_CACHE=/app/.cache
RUN mkdir -p /app/.cache && chown -R nextjs:nodejs /app /home/nextjs
USER nextjs

# Expose ports
EXPOSE 3000 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node --version && python3 --version

# Start both services
CMD ["sh", "-c", "python3 -m uvicorn python.clip_service.main:app --host 0.0.0.0 --port 8000 & node server.js"]
