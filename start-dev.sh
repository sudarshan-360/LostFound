#!/bin/bash

# Lost & Found FAISS Integration Development Startup Script

echo "🚀 Starting Lost & Found FAISS Integration Development Environment"
echo "=================================================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first."
    echo "   On macOS: brew services start mongodb-community"
    echo "   On Ubuntu: sudo systemctl start mongod"
    echo "   On Windows: net start MongoDB"
fi

echo ""
echo "📦 Installing Python dependencies..."
cd backend
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt

echo ""
echo "🐍 Starting Python FastAPI service on port 8000..."
uvicorn main:app --reload --port 8000 &
FAISS_PID=$!

# Wait for FastAPI to start
sleep 5

echo ""
echo "📦 Installing Node.js dependencies..."
cd ..
npm install

echo ""
echo "⚛️  Starting Next.js development server on port 3000..."
npm run dev &
NEXTJS_PID=$!

echo ""
echo "✅ Development environment started!"
echo ""
echo "🌐 Services:"
echo "   - Next.js App: http://localhost:3000"
echo "   - Python FastAPI: http://localhost:8000"
echo "   - FastAPI Docs: http://localhost:8000/docs"
echo ""
echo "📚 Next steps:"
echo "   1. Open http://localhost:3000 in your browser"
echo "   2. Report a found item to populate the FAISS index"
echo "   3. Report a lost item to see similarity matching in action"
echo ""
echo "🛑 To stop all services, press Ctrl+C"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $FAISS_PID 2>/dev/null
    kill $NEXTJS_PID 2>/dev/null
    echo "✅ All services stopped."
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT

# Wait for user to stop
wait
