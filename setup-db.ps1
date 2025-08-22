# Database Setup Script for Carrier Service Lookup
Write-Host "🚀 Setting up database for Carrier Service Lookup" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ ERROR: .env.local file not found" -ForegroundColor Red
    Write-Host "Please create .env.local and add your DATABASE_URL" -ForegroundColor Yellow
    Write-Host "Format: DATABASE_URL=`"postgresql://username:password@host:port/database`"" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ .env.local found" -ForegroundColor Green

# Generate Prisma Client
Write-Host "📦 Generating Prisma Client..." -ForegroundColor Blue
npx prisma generate

# Create and run migration
Write-Host "🔄 Creating and applying database migration..." -ForegroundColor Blue
npx prisma migrate dev --name init

# Seed the database (if seed file exists)
if (Test-Path "prisma/seed.ts") {
    Write-Host "🌱 Seeding database..." -ForegroundColor Blue
    npm run db:seed
}
else {
    Write-Host "ℹ️  No seed file found, skipping seeding" -ForegroundColor Yellow
}

Write-Host "✅ Database setup complete!" -ForegroundColor Green
Write-Host "Your Carrier Service Lookup database is ready to use." -ForegroundColor Green
