#!/bin/bash
# Setup for IP-only deployment (no SSL)
# Usage: ./setup-ip-only.sh 146.190.53.175

IP_ADDRESS=$1

if [ -z "$IP_ADDRESS" ]; then
    echo "Error: Please provide your droplet IP address as an argument."
    echo "Example: ./setup-ip-only.sh 146.190.53.175"
    exit 1
fi

# Update Nginx configuration
echo "Updating Nginx configuration for IP address $IP_ADDRESS..."

# Create Nginx config
cat > /etc/nginx/sites-available/napps-summit << EOL
server {
    listen 80;
    server_name $IP_ADDRESS;
    
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

# Enable the site (if not already enabled)
if [ ! -f /etc/nginx/sites-enabled/napps-summit ]; then
    ln -s /etc/nginx/sites-available/napps-summit /etc/nginx/sites-enabled/
fi

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx

echo "IP-only setup completed successfully!"
echo "Your site should now be accessible at http://$IP_ADDRESS"