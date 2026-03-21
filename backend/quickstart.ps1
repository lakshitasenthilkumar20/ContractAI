# Quick Start Script for ContractInsight AI Backend
# This script helps you get started quickly

Write-Host "🚀 ContractInsight AI Backend - Quick Start" -ForegroundColor Cyan
Write-Host "=" * 60

# Check if virtual environment exists
if (-Not (Test-Path "venv")) {
    Write-Host "`n📦 Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "✅ Virtual environment created" -ForegroundColor Green
} else {
    Write-Host "`n✅ Virtual environment already exists" -ForegroundColor Green
}

# Activate virtual environment
Write-Host "`n🔧 Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Install dependencies
Write-Host "`n📥 Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

# Check if MongoDB is running
Write-Host "`n🔍 Checking MongoDB connection..." -ForegroundColor Yellow
try {
    $mongoTest = mongosh --eval "db.version()" --quiet 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ MongoDB is running" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Could not connect to MongoDB. Make sure it's running!" -ForegroundColor Red
    Write-Host "   Start MongoDB with: net start MongoDB" -ForegroundColor Yellow
}

# Ask if user wants to seed database
Write-Host "`n🌱 Do you want to seed the database with test users?" -ForegroundColor Yellow
$seed = Read-Host "   (yes/no)"
if ($seed -eq "yes" -or $seed -eq "y") {
    Write-Host "`n📊 Seeding database..." -ForegroundColor Yellow
    python seed_users.py
}

Write-Host "`n" + "=" * 60
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "`nTo start the server, run:" -ForegroundColor Cyan
Write-Host "   uvicorn app.main:app --reload" -ForegroundColor White
Write-Host "`nAPI will be available at:" -ForegroundColor Cyan
Write-Host "   http://localhost:8000" -ForegroundColor White
Write-Host "   http://localhost:8000/docs (Swagger UI)" -ForegroundColor White
Write-Host "`n" + "=" * 60
