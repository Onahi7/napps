# NAPPS Summit Platform

## Deployment Guide for DigitalOcean

### Prerequisites
- Node.js 18+ installed on local machine
- Git installed on local machine
- DigitalOcean account
- Domain name (optional but recommended)

### 1. Prepare Your Project for Production

1. Create a production build locally first:
```bash
npm run build
```

2. Ensure all environment variables are properly set in `.env`:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
# Redis
REDIS_URL=redis://localhost:6379
# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key
# Paystack
PAYSTACK_SECRET_KEY=your-paystack-secret
PAYSTACK_PUBLIC_KEY=your-paystack-public
```

### 2. Set Up DigitalOcean Droplet

1. Create a new Ubuntu droplet (recommended specs):
   - Ubuntu 22.04 LTS
   - Basic plan with 2GB RAM / 1 CPU minimum
   - Choose a datacenter region close to your users
   - Add SSH key authentication

2. Initial Server Setup:
```bash
# Update system packages
sudo apt update
sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Redis
sudo apt install redis-server -y

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y
```

### 3. Database Setup

1. Configure PostgreSQL:
```bash
# Switch to postgres user
sudo -i -u postgres

# Create database
createdb napps_summit

# Create user
createuser --interactive --pwprompt

# Grant privileges
psql
GRANT ALL PRIVILEGES ON DATABASE napps_summit TO your_user;
```

2. Configure Redis:
```bash
# Edit Redis configuration
sudo nano /etc/redis/redis.conf

# Set password and bind to localhost
requirepass your_redis_password
bind 127.0.0.1
```

### 4. Project Deployment

1. Clone repository:
```bash
# Create app directory
mkdir /var/www/napps-summit
cd /var/www/napps-summit

# Clone repository
git clone your-repository-url .
```

2. Install dependencies and build:
```bash
# Install dependencies
npm install

# Create production build
npm run build
```

3. Set up PM2 process:
```bash
# Start application with PM2
pm2 start npm --name "napps-summit" -- start

# Save PM2 process list
pm2 save

# Setup PM2 to start on system reboot
pm2 startup
```

### 5. Nginx Configuration

1. Create Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

2. Enable SSL with Certbot:
```bash
# Install Certbot
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# Get SSL certificate
sudo certbot --nginx
```

### 6. Database Migration

1. Run migrations:
```bash
# Navigate to project directory
cd /var/www/napps-summit

# Run migrations
npm run migrate
```

### 7. Monitoring & Maintenance

1. Setup basic monitoring:
```bash
# Monitor logs
pm2 logs

# Monitor application status
pm2 status

# Monitor system resources
htop
```

2. Regular maintenance tasks:
```bash
# Update system packages
sudo apt update && sudo apt upgrade

# Backup database
pg_dump -U your_user napps_summit > backup.sql

# Restart application after updates
pm2 restart napps-summit
```

### 8. Security Considerations

1. Configure firewall:
```bash
# Allow only necessary ports
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

2. Set up automated security updates:
```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

### Troubleshooting

Common issues and solutions:

1. Application not starting:
   - Check PM2 logs: `pm2 logs`
   - Verify environment variables
   - Check Node.js version

2. Database connection issues:
   - Verify PostgreSQL is running: `systemctl status postgresql`
   - Check database credentials
   - Verify firewall settings

3. Redis connection issues:
   - Check Redis status: `systemctl status redis`
   - Verify Redis password
   - Check Redis binding

### Useful Commands

```bash
# View application logs
pm2 logs napps-summit

# Restart application
pm2 restart napps-summit

# View nginx error logs
sudo tail -f /var/log/nginx/error.log

# View nginx access logs
sudo tail -f /var/log/nginx/access.log

# Database backup
pg_dump -U your_user napps_summit > backup_$(date +%Y%m%d).sql

# Monitor system resources
htop
```

