# IP-Based Deployment Guide for Napps Summit

This guide provides specific instructions for deploying Napps Summit to DigitalOcean droplet with IP: 146.190.53.175

## Prerequisites

1. Access to your DigitalOcean droplet (ubuntu-s-2vcpu-4gb-amd-sfo3-01)
2. Access to your DigitalOcean managed PostgreSQL database
3. SSH access to your droplet via `ssh root@146.190.53.175`

## Step 1: Connect and Set Up Base Environment

```bash
# SSH into your droplet
ssh root@146.190.53.175

# Update system packages
apt update && apt upgrade -y

# Install necessary tools
apt install -y git curl wget nginx postgresql-client
```

## Step 2: Clone Repository

```bash
mkdir -p /opt/napps-summit
cd /opt/napps-summit
git clone https://github.com/your-username/napps-summit.git .
```

## Step 3: Set Up Environment Variables

The `.env.production` file has been created with your actual database, Redis and Paystack credentials:

```bash
cp .env.production .env
```

## Step 4: Run the Setup Script

```bash
chmod +x scripts/setup-digitalocean.sh
./scripts/setup-digitalocean.sh
```

This will:
- Install Node.js, npm, and other dependencies
- Set up Nginx with the correct IP configuration
- Prepare your application environment

## Step 5: Database Setup

Your database connection details:
- Host: napps-summit-do-user-15422021-0.h.db.ondigitalocean.com
- Port: 25060
- Username: doadmin
- Password: AVNS_wKxFhQigm8sRJCuSkTN
- Database: defaultdb

Ensure your droplet's IP (146.190.53.175) is added to trusted sources in the DigitalOcean database settings, then run:

```bash
chmod +x scripts/init-digitalocean-db.sh
./scripts/init-digitalocean-db.sh "postgres://doadmin:AVNS_wKxFhQigm8sRJCuSkTN@napps-summit-do-user-15422021-0.h.db.ondigitalocean.com:25060/defaultdb"
```

If you need to restore a database backup:

```bash
PGPASSWORD=AVNS_wKxFhQigm8sRJCuSkTN pg_restore -U doadmin -h napps-summit-do-user-15422021-0.h.db.ondigitalocean.com -p 25060 -d defaultdb /path/to/your/backup.sql
```

## Step 6: Configure Paystack Split Code

Update your Paystack split code with the included script:

```bash
chmod +x scripts/update-split-code.sh
./scripts/update-split-code.sh
```

This will set your split code to: SPL_B16ntzQaA1

## Step 7: Deploy the Application

```bash
chmod +x scripts/deploy-digitalocean.sh
./scripts/deploy-digitalocean.sh
```

## Step 8: Test Your Application

Visit your application at: http://146.190.53.175

## Additional Configuration

### Redis Configuration

Your Redis is already configured with these settings:
- Host: redis-19187.c89.us-east-1-3.ec2.redns.redis-cloud.com
- Port: 19187
- Username: default
- Password: fhyxR5domd04xizgMytyE5T61NPsvH85

### Setup for Production Domain (When Ready)

Once you have a domain name pointed to this IP:

1. Update Nginx configuration:
```bash
nano /etc/nginx/sites-available/napps-summit
```

2. Change `server_name 146.190.53.175;` to `server_name your-domain.com;`

3. Set up SSL:
```bash
chmod +x scripts/setup-ssl.sh
./scripts/setup-ssl.sh your-domain.com
```

4. Update your `.env` file:
```bash
sed -i 's|http://146.190.53.175|https://your-domain.com|g' .env
```

5. Restart the application:
```bash
pm2 restart napps-summit
```

### Monitoring

```bash
# View logs
pm2 logs napps-summit

# Monitor application
pm2 monit

# Check status
pm2 status
```

### Troubleshooting

- Check Nginx logs: `tail -f /var/log/nginx/error.log`
- Test database connection: `nc -zv napps-summit-do-user-15422021-0.h.db.ondigitalocean.com 25060`
- Check application logs: `pm2 logs napps-summit`