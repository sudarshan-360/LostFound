# Lost & Found Platform

A comprehensive web application for managing lost and found items with real-time chat functionality, built with Next.js, MongoDB, and Socket.IO.

## Features

### Core Functionality

- **Item Management**: Post and search for lost/found items
- **Real-time Chat**: Direct messaging between users about items
- **Image Upload**: Cloudinary integration for item photos
- **User Authentication**: Secure login/registration with NextAuth.js
- **Admin Panel**: Moderation tools for managing reported content
- **Search & Filters**: Advanced filtering by category, location, date

### Technical Features

- **Real-time Updates**: Socket.IO for instant messaging
- **Rate Limiting**: API protection against abuse
- **Input Validation**: Zod schemas for type-safe data handling
- **Responsive Design**: Mobile-first UI with Tailwind CSS
- **Testing Suite**: Jest configuration for API testing
- **Type Safety**: Full TypeScript implementation

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB, Mongoose
- **Authentication**: NextAuth.js with MongoDB adapter
- **Real-time**: Socket.IO for chat functionality
- **File Storage**: Cloudinary for image management
- **Testing**: Jest with MongoDB Memory Server
- **Validation**: Zod for schema validation
- **Security**: bcryptjs for password hashing, rate limiting

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB database
- Cloudinary account for image storage

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

   ```

# Database

MONGODB_URI=mongodb://localhost:27017/lostfound

# NextAuth.js

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Admin (comma-separated list of admin emails)

ADMIN_EMAILS=lostfound0744@gmail.com

# Email sender configuration

EMAIL_FROM=LOST&FOUND <your-email@gmail.com>

# Cloudinary

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

````

4. **Start the development server**

   ```bash
   npm run dev
````

The application will be available at `http://localhost:3000`

### CLIP Matching (Optional Advanced Setup)

This project supports automatic matching between lost and found items using a CLIP microservice and a background worker.

1. Configure environment:

   - Copy `.env.example` to `.env.local` and set values for `MONGODB_URI`, `CLIP_SERVICE_URL`, SMTP settings, and `REDIS_URL`.

2. Start the CLIP microservice (Python):

   ```bash
   pip3 install -r python/clip_service/requirements.txt
   npm run python:clip
   ```

3. Start the BullMQ worker:

   ```bash
   npm run worker:match
   ```

4. Create items:
   - Creating a lost item via `POST /api/lost` or a found item via `POST /api/found` automatically enqueues a matching job.
   - You can also use the example `POST /api/clip/upsert` route to upsert an item and trigger matching.

Emails are sent to the lost item reporter when similarity exceeds the threshold (`SIMILARITY_THRESHOLD`, default `0.8`). Notifications are deduplicated via a `SimilarityLog` model.

### Scripts

- `npm run dev` - Start development server with Socket.IO
- `npm run dev:next` - Start Next.js development server only
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode

## API Documentation

### Authentication

- `POST /api/auth/register` - User registration
- NextAuth.js handles login/logout at `/api/auth/[...nextauth]`

### Items

- `GET /api/lost` - List lost items with search/filters (supports `lostRoom`)
- `POST /api/lost` - Create new lost item (optional `isLostRoomItem`; admin-enforced)
- `GET /api/lost/[id]` - Get specific lost item
- `PUT /api/lost/[id]` - Update lost item (owner only; admin-only for Lost Room items)
- `DELETE /api/lost/[id]` - Delete lost item (owner only; admin-only for Lost Room items)
- `PATCH /api/lost/[id]/complete` - Mark lost item completed (owner only; admin-only for Lost Room items)

- `GET /api/found` - List found items with search/filters (supports `lostRoom`)
- `POST /api/found` - Create new found item (optional `isLostRoomItem`; admin-enforced)
- `GET /api/found/[id]` - Get specific found item
- `PUT /api/found/[id]` - Update found item (owner only; admin-only for Lost Room items)
- `DELETE /api/found/[id]` - Delete found item (owner only; admin-only for Lost Room items)
- `PATCH /api/found/[id]/complete` - Mark found item completed (owner only; admin-only for Lost Room items)

#### Lost Room Support

- `isLostRoomItem` flag designates items managed by admins in the Lost Room.
- Only admins can set `isLostRoomItem` to `true` on create or update.
- Non-admins cannot update, delete, or complete items flagged `isLostRoomItem=true`.
- List endpoints support `lostRoom` query: `true` for only Lost Room items, `false` for non-Lost Room items.
- Client APIs in `lib/api.ts` support `lostRoom` filters and `isLostRoomItem` on create; server enforces permissions.

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
- Timestamps for account management

### Item (Lost/Found)

- Item details (title, description, category)
- Location and date information
- Image URLs and status tracking
- User ownership and timestamps
- Lost Room flag (`isLostRoomItem`) for admin-managed items

## Security Features

- **Authentication**: JWT-based session management
- **Authorization**: Role-based access control
- **Rate Limiting**: API endpoint protection
- **Input Validation**: Zod schema validation
- **Password Security**: bcrypt hashing
- **File Upload**: Type and size validation

## Testing

The project includes a comprehensive testing setup:

- **Unit Tests**: API route testing with Jest
- **Integration Tests**: Database operations with MongoDB Memory Server
- **Mocking**: External services and dependencies

Run tests with:

```bash
npm test
```

## Deployment

1. **Build the application**

   ```bash
   npm run build
   ```

2. **Set production environment variables**

3. **Start the production server**
   ```bash
   npm start
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.