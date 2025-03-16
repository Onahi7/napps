import { Pool } from 'pg'
import { env } from './env'
import { DatabaseMonitor } from './db-monitor'

// Disable native PG module to ensure compatibility
process.env.NODE_PG_FORCE_NATIVE = 'false'

// Create PostgreSQL connection pool with optimized settings for Digital Ocean
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DATABASE_SSL ? {
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined
  } : false,
  // Connection pool settings optimized for Digital Ocean managed database
  max: 10,                          // Reduced from 20 to prevent overloading the connection pool
  min: 2,                           // Reduced minimum connections to be more conservative
  idleTimeoutMillis: 30000,         // Reduced to 30 seconds
  connectionTimeoutMillis: 10000,   // Reduced to 10 seconds
  statement_timeout: 30000,         // Reduced to 30 seconds
  query_timeout: 20000,             // Reduced to 20 seconds 
  application_name: 'napps_summit',
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
})

// Initialize database monitoring
const monitor = DatabaseMonitor.getInstance(pool)

// Helper to get a client from the pool with error handling
export async function getClient(retries = 5, delay = 2000) {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const client = await pool.connect();
      const release = client.release.bind(client);
      
      // Override release method to catch errors
      client.release = () => {
        client.release = release;
        return release();
      };
      
      return client;
    } catch (err: unknown) {
      const error = err as Error;
      console.error(`Database connection attempt ${attempt + 1}/${retries} failed:`, error.message);
      lastError = error;
      monitor.recordError(error);
      
      // Only wait if we're going to retry
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Failed to get database client after retries');
}

// Helper for single queries with retry capability
export async function query(text: string, params?: any[], retries = 3) {
  const start = Date.now();
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;

      // Record metrics
      monitor.recordQuery(duration);
      if (duration > 1000) {
        console.warn('Slow query:', { text, duration, rows: result.rowCount });
      }

      return result;
    } catch (err) {
      const error = err as Error;
      console.error(`Query attempt ${attempt + 1}/${retries} failed:`, { text, error: error.message });
      lastError = error;
      monitor.recordError(error);
      
      // Check if error is retryable
      const retryableError = 
        error.message.includes('connection') || 
        error.message.includes('timeout') ||
        error.message.includes('Connection terminated') ||
        error.message.includes('too many clients');  // Added check for connection pool limit
        
      if (!retryableError || attempt >= retries - 1) {
        throw error;
      }
      
      // Exponential backoff for retries
      const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 8000);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
  
  throw lastError || new Error('Query failed after all retries');
}

// Transaction helper with automatic rollback
export async function withTransaction<T>(
  callback: (client: any) => Promise<T>,
  retries = 3
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    let client;
    try {
      client = await getClient();
    } catch (err) {
      console.error(`Failed to get client for transaction attempt ${attempt + 1}/${retries}:`, err);
      lastError = err as Error;
      // Exponential backoff before retrying
      if (attempt < retries - 1) {
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 8000);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
      continue; // Skip to next retry attempt
    }
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      lastError = err as Error;
      try {
        await client.query('ROLLBACK');
      } catch (rollbackErr) {
        console.error('Error during transaction rollback:', rollbackErr);
      }
      
      const errorMessage = String(lastError);
      const retryableError = 
        errorMessage.includes('connection') || 
        errorMessage.includes('timeout') ||
        errorMessage.includes('Connection terminated') ||
        errorMessage.includes('too many clients');  // Added check for connection pool limit
        
      if (!retryableError || attempt >= retries - 1) {
        throw lastError;
      }
      
      console.log(`Retrying transaction after error: ${errorMessage}`);
      // Exponential backoff before retrying
      const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 8000);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    } finally {
      client?.release();
    }
  }
  
  throw lastError || new Error('Transaction failed after retries');
}

// Health check function with timeout
export async function checkDatabaseHealth(timeout = 10000) {
  try {
    const healthCheckPromise = monitor.checkHealth();
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Database health check timed out')), timeout);
    });
    
    return await Promise.race([healthCheckPromise, timeoutPromise]);
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Database health check failed:', error);
    return false;
  }
}

// Get database metrics
export async function getDatabaseMetrics() {
  return {
    metrics: monitor.getMetrics(),
    poolState: await monitor.getPoolState()
  }
}

// Graceful shutdown helper
export async function closeDatabase() {
  await pool.end()
}