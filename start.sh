#!/bin/bash

# Recipe Buddy - Start Script
# This script starts both the backend and frontend servers in separate terminal windows

echo "🍳 Starting Recipe Buddy..."
echo ""

# Check if backend virtual environment exists
if [ ! -d "backend/.venv" ]; then
    echo "❌ Backend virtual environment not found!"
    echo "   Run: cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt"
    exit 1
fi

# Check if frontend node_modules exists
if [ ! -d "frontend/node_modules" ]; then
    echo "❌ Frontend dependencies not found!"
    echo "   Run: cd frontend && npm install"
    exit 1
fi

# Get the absolute path of the project directory
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🔧 Opening backend server in new terminal..."
osascript -e "tell application \"Terminal\"
    do script \"cd '$PROJECT_DIR/backend' && .venv/bin/python main.py\"
    activate
end tell"

echo "⏳ Waiting for backend to start..."
sleep 2

echo "🎨 Opening frontend server in new terminal..."
osascript -e "tell application \"Terminal\"
    do script \"cd '$PROJECT_DIR/frontend' && npm run dev\"
    activate
end tell"

echo ""
echo "✅ Recipe Buddy is starting in separate terminals!"
echo ""
echo "📍 Backend API: http://localhost:8000"
echo "📍 API Docs: http://localhost:8000/docs"
echo "📍 Frontend: http://localhost:3000"
echo ""
echo "💡 Each server is running in its own terminal window for easy debugging"
echo "   Close each terminal window to stop the respective server"
echo ""
