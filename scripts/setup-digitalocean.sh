#!/bin/bash

# Initial setup script for Digital Ocean droplet
echo "Starting initial setup for Digital Ocean droplet..."

# Update package lists
echo "Updating package lists..."
apt-get update

# Install necessary packages
echo "Installing required packages..."
apt-get install -y curl git build-essential

# Install Node.js and npm
echo "Installing Node.js and npm..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verify installations
echo "Verifying installations..."
node -v
npm -v

# Install PM2 globally
echo "Installing PM2 globally..."
npm install -g pm2

# Create app directory if it doesn't exist
echo "Setting up application directory..."
mkdir -p /opt/napps-summit

# Copy environment file
echo "Copying environment file..."
cp .env.production .env

# Install dependencies with legacy peer deps flag
echo "Installing dependencies with --legacy-peer-deps..."
npm ci --legacy-peer-deps

# Run database migrations
echo "Running database migrations..."
node -r ts-node/register scripts/init-database.ts

# Setup Nginx if needed
if ! command -v nginx &> /dev/null; then
    echo "Installing and configuring Nginx..."
    apt-get install -y nginx
    
    # Create Nginx config
    cat > /etc/nginx/sites-available/napps-summit << EOL
server {
    listen 80;
    server_name 146.190.53.175;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL
    
    # Enable the site
    ln -s /etc/nginx/sites-available/napps-summit /etc/nginx/sites-enabled/
    
    # Test Nginx configuration
    nginx -t
    
    # Restart Nginx
    systemctl restart nginx
fi

echo "Initial setup completed successfully!"