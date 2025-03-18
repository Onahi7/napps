# Napps Summit Deployment Guide (IP-Based)

This guide provides step-by-step instructions for deploying the Napps Summit application to your DigitalOcean droplet with IP: 146.190.53.175.

## Prerequisites

1. DigitalOcean droplet (ubuntu-s-2vcpu-4gb-amd-sfo3-01) with IP 146.190.53.175
2. DigitalOcean managed PostgreSQL database 
3. SSH access to your droplet

## Step 1: Initial Server Setup

```bash
# SSH into your droplet
ssh root@146.190.53.175

# Update system packages
apt update && apt upgrade -y

# Install necessary dependencies
apt install -y git curl wget nginx postgresql-client redis-tools
```

## Step 2: Clone Repository

```bash
# Create application directory
mkdir -p /opt/napps/napps
cd /opt/napps/napps

# Clone your repository - replace with your actual repo URL
git clone https://github.com/your-username/napps-summit.git .
```

## Step 3: Install Node.js and npm

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify installation
node --version
npm --version

# Install PM2 globally for process management
npm install -g pm2
```

## Step 4: Configure Environment Variables

Create the `.env` file with all required settings:

```bash
cat > .env << EOL
# Database connection settings
DATABASE_URL=postgres://doadmin:AVNS_wKxFhQigm8sRJCuSkTN@napps-summit-do-user-15422021-0.h.db.ondigitalocean.com:25060/defaultdb
DATABASE_SSL=true

# Redis configuration
REDIS_HOST=redis-19187.c89.us-east-1-3.ec2.redns.redis-cloud.com
REDIS_PORT=19187
REDIS_PASSWORD=fhyxR5domd04xizgMytyE5T61NPsvH85
REDIS_USERNAME=default

# NextAuth settings
NEXTAUTH_URL=http://146.190.53.175
NEXTAUTH_SECRET=3cd895f92b9937b9b7ebdefbf1351da1

# Public URL
NEXT_PUBLIC_APP_URL=http://146.190.53.175

# Paystack keys
PAYSTACK_SECRET_KEY=sk_live_b86f31f4d4eefab3de0668cb7a4452c7e1ae35de
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_b86f31f4d4eefab3de0668cb7a4452c7e1ae35de

# Set NODE_ENV for production
NODE_ENV=production
EOL
```

## Step 5: Install Project Dependencies

```bash
# Install dependencies with legacy peer deps flag
npm install --legacy-peer-deps

# Install Redis client (if not included in package.json)
npm install redis --save --legacy-peer-deps
```

## Step 6: Set Up and Initialize Database

The PostgreSQL migrations need to be carefully applied in the correct sequence. First, ensure your database server allows connections from your droplet by adding your droplet IP (146.190.53.175) to the allowed connections in your DigitalOcean database settings.

```bash
# 1. First verify your connection to the database
PGPASSWORD=AVNS_wKxFhQigm8sRJCuSkTN psql -U doadmin -h napps-summit-do-user-15422021-0.h.db.ondigitalocean.com -p 25060 -d defaultdb -c "SELECT 1 as connection_test;"

# 2. Create required PostgreSQL extensions
PGPASSWORD=AVNS_wKxFhQigm8sRJCuSkTN psql -U doadmin -h napps-summit-do-user-15422021-0.h.db.ondigitalocean.com -p 25060 -d defaultdb << EOF
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EOF

# 3. Apply migrations in the correct order
# First apply the create-exec-sql-function.sql migration
echo "Applying create-exec-sql-function.sql..."
PGPASSWORD=AVNS_wKxFhQigm8sRJCuSkTN psql -U doadmin -h napps-summit-do-user-15422021-0.h.db.ondigitalocean.com -p 25060 -d defaultdb -f migrations/create-exec-sql-function.sql

# Next apply the core schema initialization
echo "Applying init-postgresql.sql..."
PGPASSWORD=AVNS_wKxFhQigm8sRJCuSkTN psql -U doadmin -h napps-summit-do-user-15422021-0.h.db.ondigitalocean.com -p 25060 -d defaultdb -f migrations/init-postgresql.sql

# Apply unique constraints
echo "Applying add-unique-constraints.sql..."
PGPASSWORD=AVNS_wKxFhQigm8sRJCuSkTN psql -U doadmin -h napps-summit-do-user-15422021-0.h.db.ondigitalocean.com -p 25060 -d defaultdb -f migrations/add-unique-constraints.sql

# Fix profile insert issues
echo "Applying fix-profile-insert.sql..."
PGPASSWORD=AVNS_wKxFhQigm8sRJCuSkTN psql -U doadmin -h napps-summit-do-user-15422021-0.h.db.ondigitalocean.com -p 25060 -d defaultdb -f migrations/fix-profile-insert.sql

# Update phone login functionality
echo "Applying phone-login-update.sql..."
PGPASSWORD=AVNS_wKxFhQigm8sRJCuSkTN psql -U doadmin -h napps-summit-do-user-15422021-0.h.db.ondigitalocean.com -p 25060 -d defaultdb -f migrations/phone-login-update.sql

# 4. Verify the database tables were created successfully
echo "Verifying database setup..."
PGPASSWORD=AVNS_wKxFhQigm8sRJCuSkTN psql -U doadmin -h napps-summit-do-user-15422021-0.h.db.ondigitalocean.com -p 25060 -d defaultdb -c "\dt"
```

If you see any error messages during the migration process, please check the error details carefully. Common issues include:

1. Tables already exist (can be ignored if this is not your first deployment)
2. Missing extensions (should be handled by our extension creation step)
3. Syntax errors specific to PostgreSQL (check the output for details)

## Step 7: Configure Paystack Split Code

```bash
# Insert or update the Paystack split code in the database
PGPASSWORD=AVNS_wKxFhQigm8sRJCuSkTN psql -U doadmin -h napps-summit-do-user-15422021-0.h.db.ondigitalocean.com -p 25060 -d defaultdb -c "UPDATE config SET value = '\"SPL_B16ntzQaA1\"' WHERE key = 'payment_split_code';"
```

## Step 8: Build the Application

```bash
# Build the Next.js application
npm run build
```

## Step 9: Configure Nginx

```bash
# Create Nginx configuration file
cat > /etc/nginx/sites-available/napps << EOL
server {
    listen 80;
    server_name 146.190.53.175;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

# Enable the site by creating a symbolic link
ln -sf /etc/nginx/sites-available/napps /etc/nginx/sites-enabled/

# Test Nginx configuration
nginx -t

# If the test is successful, reload Nginx
systemctl reload nginx
```

## Step 10: Start the Application with PM2

```bash
# Start the application with PM2
cd /opt/napps/napps
pm2 start npm --name "napps" -- start

# Save PM2 process list to restart automatically on reboot
pm2 save

# Set up PM2 to start on system boot
pm2 startup
```

## Step 11: Test Your Application

Visit http://146.190.53.175 in your browser to access your application.

## Database Backup and Restore

### Create a Database Backup

```bash
# Create a backup file
PGPASSWORD=AVNS_wKxFhQigm8sRJCuSkTN pg_dump -U doadmin -h napps-summit-do-user-15422021-0.h.db.ondigitalocean.com -p 25060 -d defaultdb > napps_summit_backup_$(date +%Y%m%d).sql
```

### Restore Database from Backup

```bash
# Restore from a backup file
PGPASSWORD=AVNS_wKxFhQigm8sRJCuSkTN psql -U doadmin -h napps-summit-do-user-15422021-0.h.db.ondigitalocean.com -p 25060 -d defaultdb < /path/to/backup.sql

# Or restore from a .dump file
PGPASSWORD=AVNS_wKxFhQigm8sRJCuSkTN pg_restore -U doadmin -h napps-summit-do-user-15422021-0.h.db.ondigitalocean.com -p 25060 -d defaultdb /path/to/backup.dump
```

## Common Maintenance Tasks

### Update the Application

```bash
# Pull latest changes
cd /opt/napps/napps
git pull

# Install any new dependencies
npm install --legacy-peer-deps

# Rebuild the application
npm run build

# Restart the application
pm2 restart napps
```

### Monitoring and Logs

```bash
# View application logs
pm2 logs napps

# Monitor application in real-time
pm2 monit

# View Nginx access logs
tail -f /var/log/nginx/access.log

# View Nginx error logs
tail -f /var/log/nginx/error.log
```

### Setting Up a Domain Name (Future)

Once you have a domain name pointing to your IP:

1. Update Nginx configuration:
```bash
nano /etc/nginx/sites-available/napps-summit
```

2. Change `server_name 146.190.53.175;` to `server_name your-domain.com;`

3. Install Certbot:
```bash
apt-get update
apt-get install -y certbot python3-certbot-nginx
```

4. Obtain SSL certificate:
```bash
certbot --nginx -d your-domain.com
```

5. Update environment variables:
```bash
sed -i 's|http://146.190.53.175|https://your-domain.com|g' /opt/napps/napps/.env
```

6. Restart the application:
```bash
pm2 restart napps-summit
```

## Troubleshooting

### Application Not Starting
```bash
# Check PM2 logs
pm2 logs napps

# Verify environment variables
nano /opt/napps/napps/.env

# Ensure Node.js is working
node -v
```

### Database Connection Issues
```bash
# Test connection
PGPASSWORD=AVNS_wKxFhQigm8sRJCuSkTN psql -U doadmin -h napps-summit-do-user-15422021-0.h.db.ondigitalocean.com -p 25060 -d defaultdb -c "SELECT 1"

# Check if your IP is allowed in DigitalOcean database settings
curl https://ipinfo.io/ip
```

### Nginx Issues
```bash
# Check Nginx status
systemctl status nginx

# Test Nginx configuration
nginx -t

# Check site configuration
cat /etc/nginx/sites-available/napps-summit
```

### Database Schema Issues
```bash
# View table structure
PGPASSWORD=AVNS_wKxFhQigm8sRJCuSkTN psql -U doadmin -h napps-summit-do-user-15422021-0.h.db.ondigitalocean.com -p 25060 -d defaultdb -c "\d profiles"

# Run manual fixes if needed
PGPASSWORD=AVNS_wKxFhQigm8sRJCuSkTN psql -U doadmin -h napps-summit-do-user-15422021-0.h.db.ondigitalocean.com -p 25060 -d defaultdb
```