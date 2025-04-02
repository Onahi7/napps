import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { env } from './env'

// Type guard to check if an error has required properties
function isDbError(error: unknown): error is { message: string; code?: string; detail?: string } {
  return error instanceof Error || (typeof error === 'object' && error !== null && 'message' in error);
}

export async function verifyDatabaseConnection() {
  let dbUrl = env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  // Log redacted connection string for debugging
  const redactedUrl = dbUrl.replace(/\/\/[^:]+:[^@]+@/, '//[USERNAME]:[PASSWORD]@');
  console.log('Attempting database connection with:', redactedUrl);

  // Configure pool with proper error handling
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: env.DATABASE_SSL ? {
      rejectUnauthorized: false
    } : false,
    // Short timeout for quick verification
    connectionTimeoutMillis: 5000
  });

  try {
    console.log('Testing database connection...');
    
    try {
      const client = await pool.connect();
      
      try {
        console.log('Connection established, testing query...');
        // Simple query to verify connection works
        const result = await client.query('SELECT version()');
        console.log('Database connected successfully:', result.rows[0].version);
        
        // Check if required tables exist
        console.log('Checking database schema...');
        const tables = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name IN ('User', 'Participant')
        `);
        
        const requiredTables = ['User', 'Participant'];
        const existingTables = tables.rows.map(row => row.table_name);
        const missingTables = requiredTables.filter(table => !existingTables.includes(table));
        
        if (missingTables.length > 0) {
          throw new Error(`Required tables missing: ${missingTables.join(', ')}`);
        }
        
        console.log('Database schema verified');
        return true;
      } catch (queryError) {
        console.error('Database query failed:', queryError);
        throw queryError;
      } finally {
        client.release();
      }
    } catch (error) {
      if (!isDbError(error)) {
        throw new Error('Unknown database connection error');
      }

      console.error('Database connection failed:', {
        message: error.message,
        code: error.code,
        detail: error.detail
      });
      
      // Check for common errors and provide helpful messages
      if (error.message.includes('password authentication failed')) {
        throw new Error('Database authentication failed. Check your username and password in the DATABASE_URL');
      } else if (error.message.includes('connect ETIMEDOUT')) {
        throw new Error('Database connection timed out. Check your network or firewall settings');
      } else if (error.message.includes('getaddrinfo ENOTFOUND')) {
        throw new Error('Database host not found. Check your hostname in the DATABASE_URL');
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Database verification failed:', error);
    throw error;
  } finally {
    await pool.end().catch(err => {
      console.error('Error closing database pool:', err);
    });
  }
}