# Digital Ocean Database Setup Guide

This guide explains how to set up a managed PostgreSQL database on Digital Ocean for the Napps Summit application.

## Step 1: Create a Managed Database

1. Log in to your Digital Ocean account
2. Go to Databases in the left menu
3. Click "Create Database"
4. Select PostgreSQL as the database engine
5. Choose a plan size (Starter/Basic plan should be sufficient to start)
6. Select a region closest to your users (ideally same region as your droplet)
7. Add a name like "napps-summit-db"
8. Click "Create Database Cluster"

## Step 2: Configure Database Access

1. Once the database is created, navigate to its "Settings" page
2. Under "Connection Details," you'll find your database connection details
3. Under "Access" section, add the IP address of your droplet to the trusted sources
   - You can also choose "Allow all incoming connections" during development, but restrict this in production

## Step 3: Configure Database Extensions

1. Go to your database's "Connection details" page
2. Click "Console" to open a SQL console
3. Run the following SQL commands to enable required extensions:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

## Step 4: Update Environment Variables

Update the `.env.production` file with your database connection details:

```
DATABASE_URL=postgres://doadmin:your_password@your-db-host:25060/defaultdb
DATABASE_SSL=true
```

Replace:
- `your_password` with your database password
- `your-db-host` with your database hostname (found in connection details)

## Step 5: Run Database Migrations

Run the database migration script:

```bash
cd /path/to/your/app
node -r ts-node/register scripts/init-database.ts
```

## Step 6: Secure Your Database

For production environments:
1. Use strong, unique passwords
2. Configure firewall rules to only allow connections from your application servers
3. Enable automatic backups from Digital Ocean dashboard
4. Consider enabling database metrics monitoring

## Paystack Split Code Configuration

After setting up your database, remember to update the payment split code in your config table:

```sql
UPDATE config SET value = '"YOUR_PAYSTACK_SPLIT_CODE"' WHERE key = 'payment_split_code';
```

Replace `YOUR_PAYSTACK_SPLIT_CODE` with the actual split code from your Paystack dashboard.