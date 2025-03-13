#!/bin/bash

# Digital Ocean Deployment Script for Napps Summit
echo "Starting deployment to Digital Ocean..."

# Build the application
echo "Building the application..."
npm run build

# Install PM2 if not already installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Stop any existing instance
echo "Stopping existing application instance..."
pm2 stop napps-summit || true

# Start the application with PM2
echo "Starting application with PM2..."
pm2 start npm --name "napps-summit" -- start

# Save PM2 process list
echo "Saving PM2 process list..."
pm2 save

# Set up PM2 to start on system boot
echo "Setting up PM2 to start on system boot..."
pm2 startup

echo "Deployment completed successfully!"