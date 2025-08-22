#!/bin/bash

echo "🚀 Setting up database for Carrier Service Lookup"
echo "================================================"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo "Please add your DATABASE_URL to .env.local file"
    echo "Format: DATABASE_URL=\"postgresql://username:password@host:port/database\""
    exit 1
fi

echo "✅ DATABASE_URL found"

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Create and run migration
echo "🔄 Creating and applying database migration..."
npx prisma migrate dev --name init

# Seed the database (if seed file exists)
if [ -f "prisma/seed.ts" ]; then
    echo "🌱 Seeding database..."
    npm run db:seed
else
    echo "ℹ️  No seed file found, skipping seeding"
fi

echo "✅ Database setup complete!"
echo "Your Carrier Service Lookup database is ready to use."
