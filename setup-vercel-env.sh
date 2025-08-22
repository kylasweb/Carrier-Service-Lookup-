#!/usr/bin/env bash

# Script to set up environment variables in Vercel
echo "🔧 Setting up environment variables in Vercel..."

# Set DATABASE_URL
echo "📦 Setting DATABASE_URL..."
echo "postgres://72eecc9406f6ffec634ed4e6e33eba8a1f6f8f033961698c1cb117cd0d807148:sk_8mWHLk4WLibHCOWr6Da3l@db.prisma.io:5432/?sslmode=require" | vercel env add DATABASE_URL production

# Set POSTGRES_URL
echo "📦 Setting POSTGRES_URL..."
echo "postgres://72eecc9406f6ffec634ed4e6e33eba8a1f6f8f033961698c1cb117cd0d807148:sk_8mWHLk4WLibHCOWr6Da3l@db.prisma.io:5432/?sslmode=require" | vercel env add POSTGRES_URL production

# Set PRISMA_DATABASE_URL
echo "📦 Setting PRISMA_DATABASE_URL..."
echo "prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza184bVdITGs0V0xpYkhDT1dyNkRhM2wiLCJhcGlfa2V5IjoiMDFLMzgyQ1BWNlFIVDFHNVhYREhUQ0YyQUEiLCJ0ZW5hbnRfaWQiOiI3MmVlY2M5NDA2ZjZmZmVjNjM0ZWQ0ZTZlMzNlYmE4YTFmNmY4ZjAzMzk2MTY5OGMxY2IxMTdjZDBkODA3MTQ4IiwiaW50ZXJuYWxfc2VjcmV0IjoiN2UxYzk2YzUtMzAwNS00ZTliLThlY2YtNzUzYzQyNTAxNWIyIn0.PmNP9hxKgtfq1HUj8gmUWpeM4LZCZXaB5_qtJDB6SIY" | vercel env add PRISMA_DATABASE_URL production

# Set NEXTAUTH_SECRET
echo "📦 Setting NEXTAUTH_SECRET..."
echo "your-super-secret-nextauth-secret-key-min-32-chars" | vercel env add NEXTAUTH_SECRET production

# Set NEXTAUTH_URL
echo "📦 Setting NEXTAUTH_URL..."
echo "https://carrier-service-lookup.vercel.app" | vercel env add NEXTAUTH_URL production

echo "✅ Environment variables set up in Vercel!"
echo "🚀 Triggering a new deployment..."

# Trigger a new deployment
vercel --prod
