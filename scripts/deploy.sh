#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment process..."

# 1. Pull latest changes
echo "📥 Pulling latest changes from git..."
git pull origin main

# 2. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 3. Build the application
echo "🏗️ Building the application..."
npm run build

# 4. Run database migrations
echo "🔄 Running database migrations..."
npm run migrate

# 5. Restart PM2 process
echo "🔄 Restarting PM2 process..."
pm2 restart napps-summit

# 6. Clear cache
echo "🧹 Clearing Redis cache..."
redis-cli FLUSHALL

# 7. Verify health
echo "🏥 Checking application health..."
curl -f http://localhost:3000/api/health || echo "⚠️ Health check failed"

echo "✅ Deployment completed!"