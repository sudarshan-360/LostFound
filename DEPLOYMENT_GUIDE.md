# LostFound App - EC2/Docker Deployment Guide

## Overview

This guide helps you deploy the LostFound Next.js app on EC2 with Docker, ensuring proper API connectivity and CORS configuration.

## Changes Made

### 1. Frontend Fetch Calls Updated

- All API calls now use relative paths by default
- `API_BASE_URL` is set to empty string, making all fetch calls relative
- This eliminates `ERR_CONNECTION_REFUSED` errors in Docker/EC2 environments

### 2. CORS Headers Added

- Created `lib/cors.ts` with comprehensive CORS configuration
- Added CORS headers to all API routes:
  - `/api/lost` (GET, POST)
  - `/api/found` (GET, POST)
  - `/api/upload` (POST, DELETE)
  - `/api/faiss/match` (POST)
- Headers include:
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS`
  - `Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With`

### 3. Docker Configuration

- Dockerfile is configured for production deployment
- Exposes ports 3000 (Next.js) and 8000 (Python CLIP service)
- Uses standalone Next.js build for optimal performance

## Deployment Steps

### 1. Build and Deploy Docker Container

```bash
# Build the Docker image
docker build -t lostfound-app .

# Run the container with proper port mapping
docker run -d \
  --name lostfound-app \
  -p 3000:3000 \
  -p 8000:8000 \
  -e MONGODB_URI="your_mongodb_atlas_uri" \
  -e NEXTAUTH_SECRET="your_nextauth_secret" \
  -e NEXTAUTH_URL="http://vitlostandfound.duckdns.org:3000" \
  -e GOOGLE_CLIENT_ID="your_google_client_id" \
  -e GOOGLE_CLIENT_SECRET="your_google_client_secret" \
  -e CLOUDINARY_CLOUD_NAME="your_cloudinary_name" \
  -e CLOUDINARY_API_KEY="your_cloudinary_key" \
  -e CLOUDINARY_API_SECRET="your_cloudinary_secret" \
  lostfound-app
```

### 2. Test API Endpoints

```bash
# Run the test script
./scripts/test-api.sh

# Or test manually:
curl http://localhost:3000/api/lost
curl http://localhost:3000/api/found
curl -I http://localhost:3000/api/lost  # Check CORS headers
```

### 3. Verify External Access

```bash
# Test external access via DuckDNS
curl http://vitlostandfound.duckdns.org:3000/api/lost
curl http://vitlostandfound.duckdns.org:3000/api/found
```

## Environment Variables Required

Make sure these environment variables are set in your Docker container:

```bash
MONGODB_URI=mongodb+srv://...
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://vitlostandfound.duckdns.org:3000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

## Troubleshooting

### ERR_CONNECTION_REFUSED

- Ensure Docker container is running: `docker ps`
- Check port mapping: `docker port lostfound-app`
- Verify firewall settings on EC2

### CORS Issues

- Check that CORS headers are present: `curl -I http://localhost:3000/api/lost`
- Ensure preflight OPTIONS requests are handled

### External Access Issues

- Verify DuckDNS is pointing to your EC2 instance
- Check EC2 security group allows inbound traffic on port 3000
- Ensure Docker port mapping is correct

## API Endpoints Available

- `GET /api/lost` - List lost items
- `POST /api/lost` - Create lost item
- `GET /api/found` - List found items
- `POST /api/found` - Create found item
- `POST /api/upload` - Upload image
- `DELETE /api/upload` - Delete image
- `POST /api/faiss/match` - Find matches

All endpoints now include proper CORS headers and use relative paths for frontend calls.
