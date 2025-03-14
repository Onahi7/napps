@echo off
echo Running consolidated schema application...

REM Use the database credentials from the .env file
set PGPASSWORD=AVNS_wKxFhQigm8sRJCuSkTN

echo Applying schema to database...
echo Host: napps-summit-do-user-15422021-0.h.db.ondigitalocean.com
echo Database: defaultdb
echo User: doadmin

psql -h napps-summit-do-user-15422021-0.h.db.ondigitalocean.com ^
     -p 25060 ^
     -U doadmin ^
     -d defaultdb ^
     -f ../migrations/consolidated_schema.sql

if %errorlevel% neq 0 (
  echo Schema application failed with error code %errorlevel%
  exit /b %errorlevel%
)

echo Schema application completed successfully.