# Lost & Found Platform

A comprehensive web application for managing lost and found items with AI-powered matching, built with Next.js, MongoDB, and Python CLIP service.

## Features

### Core Functionality

- **Item Management**: Post and search for lost/found items with detailed categorization
- **AI-Powered Matching**: CLIP-based similarity matching between lost and found items
- **Image Upload**: Cloudinary integration for item photos with automatic embedding generation
- **User Authentication**: Google OAuth with VIT domain validation
- **Admin Panel**: Lost Room management for campus administrators
- **Search & Filters**: Advanced filtering by category, location, date, and status
- **My Reports**: Personal dashboard to manage your posted items

### AI Matching System

- **CLIP Integration**: Python microservice for image and text embedding generation
- **Similarity Scoring**: Multi-modal similarity computation (text, image, location, date)
- **Automatic Matching**: Background worker for real-time item matching
- **Email Notifications**: Automated alerts when potential matches are found
- **Lost Room Support**: Special handling for campus Lost Room items

### Technical Features

- **Real-time Processing**: Background job queue for matching operations
- **Rate Limiting**: API protection against abuse
- **Input Validation**: Zod schemas for type-safe data handling
- **Responsive Design**: Mobile-first UI with Tailwind CSS
- **Testing Suite**: Jest configuration for API testing
- **Type Safety**: Full TypeScript implementation

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB, Mongoose
- **Authentication**: NextAuth.js with Google OAuth
- **AI/ML**: Python CLIP service with FastAPI
- **File Storage**: Cloudinary for image management
- **Background Jobs**: BullMQ for matching operations
- **Testing**: Jest with MongoDB Memory Server
- **Validation**: Zod for schema validation

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+ and pip
- MongoDB database (Atlas or local)
- Cloudinary account for image storage
- Redis (optional, for background jobs)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd LostFound
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:

   ```env
   # Database
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority&appName=ClusterName

   # NextAuth.js
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key

   # Google OAuth
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret

   # Admin (comma-separated list of admin emails)
   ADMIN_EMAILS=admin@vit.ac.in

   # Email configuration
   EMAIL_FROM=LOST&FOUND <your-email@gmail.com>
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password

   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret

   # CLIP Matching System
   CLIP_API_URL=http://localhost:8000
   SIMILARITY_THRESHOLD=0.75
   BULLMQ_ENABLED=true

   # Redis (optional)
   REDIS_URL=redis://localhost:6379
   REDIS_TLS=false
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`

### CLIP Matching Setup

1. **Install Python dependencies**:

   ```bash
   cd python/clip_service
   pip install -r requirements.txt
   ```

2. **Start the CLIP microservice**:

   ```bash
   npm run python:clip
   ```

3. **Start the matching worker** (optional):

   ```bash
   npm run worker:match
   ```

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run python:clip` - Start CLIP microservice
- `npm run worker:match` - Start background matching worker
- `npm run lint` - Run ESLint
- `npm test` - Run Jest tests

## Application Pages

### Public Pages

- **Home** (`/`) - Landing page with features and information
- **Browse Lost** (`/browse-lost`) - View and search lost items
- **Browse Found** (`/browse-found`) - View and search found items
- **Login** (`/login`) - Google OAuth authentication

### User Pages (Requires Authentication)

- **Report Lost** (`/report-lost`) - Submit lost item reports
- **Report Found** (`/report-found`) - Submit found item reports
- **My Reports** (`/myreports`) - Manage your posted items
- **Item Details** (`/items/[id]`) - View individual item details

## API Documentation

### Authentication

- NextAuth.js handles login/logout at `/api/auth/[...nextauth]`
- Google OAuth with VIT domain validation
- JWT-based session management

### Items

- `GET /api/lost` - List lost items with search/filters
- `POST /api/lost` - Create new lost item
- `GET /api/lost/[id]` - Get specific lost item
- `PUT /api/lost/[id]` - Update lost item (owner only)
- `DELETE /api/lost/[id]` - Delete lost item (owner only)
- `PATCH /api/lost/[id]/complete` - Mark lost item completed

- `GET /api/found` - List found items with search/filters
- `POST /api/found` - Create new found item
- `GET /api/found/[id]` - Get specific found item
- `PUT /api/found/[id]` - Update found item (owner only)
- `DELETE /api/found/[id]` - Delete found item (owner only)
- `PATCH /api/found/[id]/complete` - Mark found item completed

### AI Matching

- `POST /api/faiss/match` - Trigger manual matching
- `GET /api/faiss/check-lost-matches` - Check matches for lost items
- `GET /api/faiss/check-found-matches` - Check matches for found items
- `POST /api/clip/upsert` - Upsert item for matching

### File Upload

- `POST /api/upload` - Upload image to Cloudinary
- `DELETE /api/upload` - Delete image from Cloudinary

### Admin

- `GET /api/admin/items` - List items for moderation
- `POST /api/admin/items` - Perform admin actions

## Database Models

### User

- Authentication and profile information
- Role-based permissions (user/admin)
- VIT domain validation
- Timestamps for account management

### Item (Lost/Found)

- Item details (title, description, category)
- Location and date information
- Image URLs and status tracking
- User ownership and timestamps
- Lost Room flag (`isLostRoomItem`) for admin-managed items
- CLIP embeddings for AI matching

### SimilarityLog

- Tracks matching operations
- Prevents duplicate notifications
- Stores similarity scores and metadata

## AI Matching System

### CLIP Integration

- **Text Embeddings**: Generated from item titles and descriptions
- **Image Embeddings**: Generated from uploaded photos
- **Multi-modal Similarity**: Combines text and image similarity scores

### Matching Algorithm

- **Weighted Scoring**: CLIP (85%), Location (10%), Date (5%)
- **Lost Room Items**: 100% CLIP-based matching
- **Threshold-based**: Configurable similarity threshold (default: 0.75)
- **Background Processing**: Automatic matching via BullMQ

### Notification System

- **Email Alerts**: Sent when similarity exceeds threshold
- **Deduplication**: Prevents spam via SimilarityLog
- **Match Details**: Includes similarity breakdown and contact information

## Security Features

- **Authentication**: Google OAuth with VIT domain validation
- **Authorization**: Role-based access control
- **Rate Limiting**: API endpoint protection
- **Input Validation**: Zod schema validation
- **File Upload**: Type and size validation
- **Admin Controls**: Lost Room item management

## Testing

The project includes comprehensive testing:

- **Unit Tests**: API route testing with Jest
- **Integration Tests**: Database operations with MongoDB Memory Server
- **Mocking**: External services and dependencies

Run tests with:

```bash
npm test
```

## Deployment

### Production Build

```bash
npm run build
npm run start
```

### Docker Deployment

```bash
# Build Docker image
docker build -t lostfound-app .

# Run container
docker run -d --name lostfound-container --env-file .env.production -p 3000:3000 -p 8000:8000 lostfound-app
```

### Environment Variables

Ensure all required environment variables are set for production:

- MongoDB Atlas connection string
- Google OAuth credentials
- Cloudinary configuration
- Email SMTP settings
- CLIP service URL

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

