# Recipe Buddy - Start Script for Windows (PowerShell)
# This script starts both the backend and frontend servers in separate PowerShell windows

Write-Host "🍳 Starting Recipe Buddy..." -ForegroundColor Green
Write-Host ""

# Check if backend virtual environment exists
if (-not (Test-Path "backend\.venv")) {
    Write-Host "❌ Backend virtual environment not found!" -ForegroundColor Red
    Write-Host "   Run: cd backend; python -m venv .venv; .venv\Scripts\pip install -r requirements.txt"
    exit 1
}

# Check if frontend node_modules exists
if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "❌ Frontend dependencies not found!" -ForegroundColor Red
    Write-Host "   Run: cd frontend; npm install"
    exit 1
}

# Get the absolute path of the project directory
$ProjectDir = Get-Location

Write-Host "🔧 Opening backend server in new PowerShell window..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectDir\backend'; .venv\Scripts\python.exe main.py"

Write-Host "⏳ Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host "🎨 Opening frontend server in new PowerShell window..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectDir\frontend'; npm run dev"

Write-Host ""
Write-Host "✅ Recipe Buddy is starting in separate PowerShell windows!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Backend API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "📍 API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "📍 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Each server is running in its own PowerShell window for easy debugging" -ForegroundColor Yellow
Write-Host "   Close each PowerShell window to stop the respective server" -ForegroundColor Yellow
Write-Host ""
