#!/bin/bash
# Deployment script for DigitalOcean
echo "Starting deployment process..."

# Navigate to application directory
cd /opt/napps-summit

# Pull latest changes
echo "Pulling latest code from repository..."
git pull

# Install dependencies with legacy peer deps flag
echo "Installing dependencies..."
npm ci --production --legacy-peer-deps

# Build the application
echo "Building the application..."
npm run build

# Restart the application with PM2
echo "Restarting the application..."
if pm2 list | grep -q "napps-summit"; then
    # Restart if already exists
    pm2 restart napps-summit
else
    # Start if doesn't exist
    pm2 start npm --name "napps-summit" -- start
    # Save PM2 configuration
    pm2 save
fi

# Run any pending migrations
echo "Running database migrations..."
node -r ts-node/register scripts/init-database.ts

echo "Deployment completed successfully!"
echo "Your application should be running at http://146.190.53.175"