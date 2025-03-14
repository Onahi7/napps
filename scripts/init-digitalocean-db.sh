#!/bin/bash
# Database initialization script for DigitalOcean Managed Database
# Usage: ./init-digitalocean-db.sh

# Database connection details are hardcoded for simplicity
DB_URL="postgres://doadmin:AVNS_wKxFhQigm8sRJCuSkTN@napps-summit-do-user-15422021-0.h.db.ondigitalocean.com:25060/defaultdb"
DB_HOST="napps-summit-do-user-15422021-0.h.db.ondigitalocean.com"
DB_PORT="25060"
DB_USER="doadmin"
DB_PASSWORD="AVNS_wKxFhQigm8sRJCuSkTN"
DB_NAME="defaultdb"

echo "Setting up required PostgreSQL extensions..."

# Create required extensions
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";"

# Run migration scripts
echo "Running database migrations..."
cd /opt/napps-summit
node -r ts-node/register scripts/init-database.ts

echo "Database initialization completed successfully!"