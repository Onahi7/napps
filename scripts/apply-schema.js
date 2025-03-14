#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
const envPath = path.resolve(process.cwd(), '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
  process.exit(1);
}

// Extract database connection details from DATABASE_URL
const extractDbCredentials = (url) => {
  try {
    // Parse DATABASE_URL (format: postgres://username:password@host:port/database)
    const regex = /postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
    const matches = url.match(regex);

    if (!matches || matches.length < 6) {
      throw new Error('Invalid DATABASE_URL format');
    }

    return {
      user: matches[1],
      password: matches[2],
      host: matches[3],
      port: matches[4],
      database: matches[5].split('?')[0], // Remove any query parameters
    };
  } catch (error) {
    console.error('Failed to parse DATABASE_URL:', error.message);
    process.exit(1);
  }
};

// Get database connection details
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL not found in .env file');
  process.exit(1);
}

const credentials = extractDbCredentials(dbUrl);
const schemaPath = path.resolve(process.cwd(), 'migrations/consolidated_schema.sql');

// Ensure the schema file exists
if (!fs.existsSync(schemaPath)) {
  console.error(`Schema file not found: ${schemaPath}`);
  process.exit(1);
}

console.log('Applying consolidated schema to database...');
console.log(`Host: ${credentials.host}`);
console.log(`Database: ${credentials.database}`);
console.log(`User: ${credentials.user}`);

// Set up the psql command
const psqlArgs = [
  '-h', credentials.host,
  '-p', credentials.port,
  '-U', credentials.user,
  '-d', credentials.database,
  '-f', schemaPath
];

// Set up environment variables for the child process
const env = { ...process.env, PGPASSWORD: credentials.password };

// Run the psql command
const psql = spawn('psql', psqlArgs, { env });

psql.stdout.on('data', (data) => {
  console.log(`${data}`);
});

psql.stderr.on('data', (data) => {
  console.error(`${data}`);
});

psql.on('close', (code) => {
  if (code === 0) {
    console.log('Schema applied successfully!');
  } else {
    console.error(`psql process exited with code ${code}`);
    process.exit(code);
  }
});