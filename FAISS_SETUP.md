# FAISS Integration Setup Guide

This guide will help you set up the full-stack integration between Next.js + TypeScript + MongoDB and Python FastAPI with FAISS similarity search.

## Architecture Overview

```
Frontend (Next.js) → API Routes → MongoDB
                    ↓
              Python FastAPI + FAISS
```

## Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.8+
- MongoDB
- Git

## 1. Python FastAPI Service Setup

### Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Start the FastAPI Service

```bash
cd backend
uvicorn main:app --reload --port 8000
```

The service will be available at `http://localhost:8000`

### Test the Service

```bash
curl http://localhost:8000/
```

You should see:

```json
{
  "status": "healthy",
  "service": "Lost & Found FAISS Service",
  "found_items_count": 0,
  "index_built": false
}
```

## 2. Next.js Application Setup

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create `.env.local` with:

```env
# Next.js Environment Variables
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here

# MongoDB
MONGODB_URI=mongodb://localhost:27017/lostfound

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Python FastAPI Service
NEXT_PUBLIC_PYTHON_API_URL=http://localhost:8000
```

### Start the Next.js Application

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 3. Development Workflow

### Start Both Services

Terminal 1 (Python FastAPI):

```bash
cd backend
uvicorn main:app --reload --port 8000
```

Terminal 2 (Next.js):

```bash
npm run dev
```

### Sync Existing Data to FAISS

Visit `http://localhost:3000/api/faiss/sync` to sync existing found items to the FAISS index.

## 4. API Endpoints

### Python FastAPI Endpoints

- `GET /` - Health check
- `POST /add-found` - Add found item to FAISS index
- `POST /match-lost` - Find matches for lost item
- `GET /found-items` - Get all found items
- `DELETE /clear-index` - Clear FAISS index

### Next.js API Endpoints

- `GET /api/faiss/health` - Check FAISS service health
- `POST /api/faiss/sync` - Sync MongoDB items to FAISS
- `POST /api/faiss/match` - Find matches for lost item
- `POST /api/found` - Create found item (auto-syncs to FAISS)
- `POST /api/lost` - Create lost item (auto-searches for matches)

## 5. How It Works

### Found Item Flow

1. User reports found item via `/report-found`
2. Item is saved to MongoDB
3. Item is automatically added to FAISS index
4. FAISS index is updated for future searches

### Lost Item Flow

1. User reports lost item via `/report-lost`
2. Item is saved to MongoDB
3. FAISS searches for similar found items
4. Matches are displayed to user with similarity scores
5. User can contact finders of matching items

### Similarity Scoring

The system uses weighted similarity scoring:

- **Text Similarity (60%)**: Based on item name and description
- **Location Similarity (30%)**: Exact match = 1.0, partial = 0.5, different = 0.0
- **Date Similarity (10%)**: Closer dates = higher score

## 6. Testing the Integration

### Test Found Item Creation

1. Go to `/report-found`
2. Fill out the form and submit
3. Check FAISS service: `curl http://localhost:8000/found-items`
4. Verify item appears in the index

### Test Lost Item Matching

1. Go to `/report-lost`
2. Fill out the form with similar details to a found item
3. Submit the form
4. Verify matches are displayed with similarity scores

### Test API Directly

```bash
# Add a found item
curl -X POST http://localhost:8000/add-found \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-1",
    "item": "iPhone 13",
    "description": "Black iPhone 13 with cracked screen",
    "location": "Library",
    "date": "2024-01-15T10:00:00Z",
    "type": "found"
  }'

# Search for matches
curl -X POST http://localhost:8000/match-lost \
  -H "Content-Type: application/json" \
  -d '{
    "id": "lost-1",
    "item": "iPhone",
    "description": "Lost my phone at the library",
    "location": "Library",
    "date": "2024-01-16T10:00:00Z"
  }'
```

## 7. Troubleshooting

### Common Issues

1. **FAISS service not responding**

   - Check if Python service is running on port 8000
   - Verify `NEXT_PUBLIC_PYTHON_API_URL` in `.env.local`

2. **No matches found**

   - Ensure found items exist in FAISS index
   - Check similarity thresholds in Python code
   - Verify item descriptions are detailed enough

3. **CORS errors**

   - Check CORS configuration in `backend/main.py`
   - Ensure Next.js URL is in allowed origins

4. **MongoDB connection issues**
   - Verify `MONGODB_URI` in `.env.local`
   - Check if MongoDB is running

### Debug Commands

```bash
# Check FAISS service health
curl http://localhost:8000/

# Check Next.js API health
curl http://localhost:3000/api/faiss/health

# Sync data to FAISS
curl -X POST http://localhost:3000/api/faiss/sync
```

## 8. Production Deployment

### Python FastAPI

- Use a production ASGI server like Gunicorn
- Set up proper environment variables
- Consider using Redis for session storage
- Use a proper database instead of in-memory storage

### Next.js

- Deploy to Vercel, Netlify, or your preferred platform
- Set up production environment variables
- Configure proper CORS settings
- Set up monitoring and logging

## 9. Performance Considerations

- FAISS index is rebuilt on every found item addition
- Consider batch processing for large datasets
- Implement caching for frequently accessed data
- Monitor memory usage of the Python service
- Consider using FAISS with GPU acceleration for large datasets

## 10. Future Enhancements

- Add more sophisticated similarity algorithms
- Implement real-time notifications for matches
- Add machine learning model training
- Implement user feedback for match quality
- Add support for image similarity matching
- Implement geospatial matching
