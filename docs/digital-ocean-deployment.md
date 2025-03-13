# Napps Summit Digital Ocean Deployment Guide

This guide provides step-by-step instructions for deploying the Napps Summit application on a Digital Ocean droplet.

## Prerequisites

1. A Digital Ocean account
2. A domain name pointed to your Digital Ocean droplet's IP address
3. Basic familiarity with command-line operations

## Step 1: Create a Digital Ocean Droplet

1. Log in to your Digital Ocean account
2. Click "Create" > "Droplets"
3. Select an image (Ubuntu 22.04 LTS recommended)
4. Choose a plan (Basic plan with 2GB RAM / 1 CPU is a good starting point)
5. Choose a datacenter region closest to your users
6. Add your SSH key or create a password
7. Name your droplet (e.g., "napps-summit")
8. Click "Create Droplet"

## Step 2: Set Up Your Database

Follow the instructions in `docs/do-database-setup.md` to create and configure your managed PostgreSQL database.

## Step 3: Connect to Your Droplet

```bash
ssh root@your-droplet-ip
```

## Step 4: Clone Your Repository

```bash
git clone https://your-repository-url.git /opt/napps-summit
cd /opt/napps-summit
```

## Step 5: Configure Environment Variables

1. Update the `.env.production` file with your specific values:
   ```bash
   nano .env.production
   ```
   
2. Copy it to the main .env file:
   ```bash
   cp .env.production .env
   ```

## Step 6: Run the Setup Script

Make the setup script executable and run it:

```bash
chmod +x scripts/setup-digitalocean.sh
./scripts/setup-digitalocean.sh
```

This will:
- Update your system
- Install Node.js, npm, and other required packages
- Set up PM2 for process management
- Install and configure Nginx
- Prepare your database

## Step 7: Set Up SSL with Let's Encrypt

Make the SSL script executable and run it with your domain name:

```bash
chmod +x scripts/setup-ssl.sh
./scripts/setup-ssl.sh your-domain.com
```

## Step 8: Deploy Your Application

Make the deployment script executable and run it:

```bash
chmod +x scripts/deploy-digitalocean.sh
./scripts/deploy-digitalocean.sh
```

## Step 9: Configure the Paystack Split Code

After deployment, configure your Paystack split code:

1. Get your split code from your Paystack dashboard
2. Update it in your database:
   ```bash
   psql "postgres://doadmin:your_password@your-db-host:25060/defaultdb" -c "UPDATE config SET value = '\"YOUR_PAYSTACK_SPLIT_CODE\"' WHERE key = 'payment_split_code';"
   ```

## Step 10: Test Your Application

Visit your domain in a web browser to verify everything works:

```
https://your-domain.com
```

## Maintenance and Scaling

### Regular Updates

To update your application with the latest changes:

1. Pull the latest code:
   ```bash
   cd /opt/napps-summit
   git pull
   ```

2. Re-run the deployment script:
   ```bash
   ./scripts/deploy-digitalocean.sh
   ```

### Database Maintenance

Run periodic database maintenance:

```bash
node -r ts-node/register scripts/maintain-database.ts
```

### Scaling

If you need more resources:

1. Shut down your application:
   ```bash
   pm2 stop napps-summit
   ```

2. Resize your droplet from the Digital Ocean dashboard

3. Restart your application:
   ```bash
   pm2 start napps-summit
   ```

### Monitoring

Set up monitoring with PM2:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

View logs:
```bash
pm2 logs napps-summit
```

## Troubleshooting

### Application Won't Start

Check the logs:
```bash
pm2 logs napps-summit
```

### Database Connection Issues

Verify your database connection:
```bash
nc -zv your-db-host 25060
```

### SSL Certificate Issues

Manually renew your certificate:
```bash
certbot renew
```

### Need More Help?

Contact support at your-email@example.com