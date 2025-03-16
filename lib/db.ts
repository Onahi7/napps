import { Pool } from 'pg'
import { env } from './env'
import { DatabaseMonitor } from './db-monitor'

// Disable native PG module to ensure compatibility
process.env.NODE_PG_FORCE_NATIVE = 'false'

// Create PostgreSQL connection pool with optimized settings for DigitalOcean
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DATABASE_SSL ? {
    rejectUnauthorized: false,  // Allow self-signed certs for DigitalOcean managed database
    checkServerIdentity: () => undefined // Skip hostname checks
  } : false,
  // Improved connection settings for DigitalOcean managed database
  max: 15,                          // Maximum number of clients
  idleTimeoutMillis: 60000,         // 1 minute idle timeout
  connectionTimeoutMillis: 10000,   // 10 second connection timeout
  statement_timeout: 60000,         // 1 minute statement timeout
  query_timeout: 30000,             // 30 second query timeout
  application_name: 'napps_summit',
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
})

// Initialize database monitoring
const monitor = DatabaseMonitor.getInstance(pool)

// Helper to get a client from the pool with error handling and retry capability
export async function getClient(retries = 3, delay = 1000) {
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
      
      // Only wait if we're going to retry
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Failed to get database client after retries');
}

// Helper for single queries with retry capability
export async function query(text: string, params?: any[], retries = 2) {
  const start = Date.now();
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;

      if (duration > 1000) {
        console.warn('Slow query:', { text, duration, rows: result.rowCount });
      }

      return result;
    } catch (err) {
      const error = err as Error;
      console.error(`Query attempt ${attempt + 1}/${retries} failed:`, { text, error: error.message });
      lastError = error;
      
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  console.error('Query failed after all retries:', { text });
  throw lastError || new Error('Query failed after all retries');
}

// Transaction helper with automatic rollback on error and retry capability
export async function withTransaction<T>(
  callback: (client: any) => Promise<T>,
  retries = 2
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    const client = await getClient();
    
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
        const error = rollbackErr as Error;
        console.error('Error during transaction rollback:', error);
      }
      
      const errorMessage = String(lastError);
      const retryableError = 
        errorMessage.includes('connection') || 
        errorMessage.includes('timeout') ||
        errorMessage.includes('Connection terminated');
        
      if (!retryableError || attempt >= retries - 1) {
        throw lastError;
      }
      
      console.log(`Retrying transaction after error: ${errorMessage}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      client.release();
    }
  }
  
  throw lastError || new Error('Transaction failed after retries');
}

// Health check function with timeout
export async function checkDatabaseHealth(timeout = 5000) {
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