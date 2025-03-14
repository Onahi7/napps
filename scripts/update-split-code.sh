#!/bin/bash
# Script to update Paystack split code in the database
# Usage: ./update-split-code.sh

# Database connection details
DB_URL="postgres://doadmin:AVNS_wKxFhQigm8sRJCuSkTN@napps-summit-do-user-15422021-0.h.db.ondigitalocean.com:25060/defaultdb"
SPLIT_CODE="SPL_B16ntzQaA1"

echo "Updating Paystack split code in the database..."

# Update the split code in the database
PGPASSWORD=AVNS_wKxFhQigm8sRJCuSkTN psql -U doadmin -h napps-summit-do-user-15422021-0.h.db.ondigitalocean.com -p 25060 -d defaultdb -c "UPDATE config SET value = '\"$SPLIT_CODE\"' WHERE key = 'payment_split_code';"

# Check if the command was successful
if [ $? -eq 0 ]; then
    echo "Split code updated successfully!"
else
    echo "Failed to update split code. Please check your database connection."
    exit 1
fi