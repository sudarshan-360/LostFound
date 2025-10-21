#!/bin/bash

# Lost & Found Development Startup Script (Next.js only)

echo "🚀 Starting Lost & Found Development Environment"
echo "=================================================="

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
echo "📦 Installing Node.js dependencies..."
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
echo ""
echo "📚 Next steps:"
echo "   1. Open http://localhost:3000 in your browser"
echo "   2. Report a found item and a lost item to see similarity matching"
echo ""
echo "🛑 To stop the server, press Ctrl+C"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping Next.js..."
    kill $NEXTJS_PID 2>/dev/null
    echo "✅ Next.js stopped."
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT

# Wait for user to stop
wait
