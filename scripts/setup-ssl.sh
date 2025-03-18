#!/bin/bash

# Setup SSL with Let's Encrypt
# Usage: ./setup-ssl.sh your-domain.com

DOMAIN=$1

if [ -z "$DOMAIN" ]; then
    echo "Error: Please provide your domain name as an argument."
    echo "Example: ./setup-ssl.sh your-domain.com"
    exit 1
fi

# Install Certbot
echo "Installing Certbot..."
apt-get update
apt-get install -y certbot python3-certbot-nginx

# Obtain and install SSL certificate
echo "Obtaining SSL certificate for $DOMAIN..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email webmaster@$DOMAIN

# Check if certificate was obtained successfully
if [ $? -ne 0 ]; then
    echo "Failed to obtain SSL certificate. Please check your domain configuration."
    exit 1
fi

# Set up auto-renewal
echo "Setting up automatic renewal..."
echo "0 0,12 * * * root python -c 'import random; import time; time.sleep(random.random() * 3600)' && certbot renew -q" | sudo tee -a /etc/crontab > /dev/null

echo "SSL setup completed successfully!"
echo "Your site should now be accessible at https://$DOMAIN"