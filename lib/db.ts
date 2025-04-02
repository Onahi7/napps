import { Pool } from 'pg'
import { env } from './env'
import { DatabaseMonitor } from './db-monitor'

// Check if code is running on the server
const isServer = typeof window === 'undefined'
if (!isServer) {
  throw new Error('Database operations can only be performed on the server')
}

// Create PostgreSQL connection pool with optimized settings
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DATABASE_SSL ? {
    rejectUnauthorized: false, // Allow self-signed certificates
  } : false,
  // Connection pool settings optimized for serverless environment
  max: 3, // Limit concurrent connections
  min: 0, // Allow scaling to zero
  idleTimeoutMillis: 30000, // 30 seconds
  connectionTimeoutMillis: 5000, // 5 seconds
  statement_timeout: 30000, // 30 seconds
  query_timeout: 15000, // 15 seconds
  application_name: 'napps_summit',
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
})

// Initialize database monitoring
const monitor = DatabaseMonitor.getInstance(pool)

// Helper for single queries with retry capability
export async function query(text: string, params?: any[], retries = 3) {
  const start = Date.now()
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const result = await pool.query(text, params)
      const duration = Date.now() - start

      // Record metrics
      monitor.recordQuery(duration)
      if (duration > 1000) {
        console.warn('Slow query:', { text, duration, rows: result.rowCount })
      }

      return result
    } catch (err) {
      const error = err as Error
      console.error(`Query attempt ${attempt + 1}/${retries} failed:`, {
        text,
        error: error.message,
        attempt: attempt + 1
      })
      
      lastError = error
      monitor.recordError(error)
      
      // Check if error is retryable
      const retryableError = 
        error.message.includes('connection') || 
        error.message.includes('timeout') ||
        error.message.includes('Connection terminated') ||
        error.message.includes('not found') // Added for endpoint not found errors
      
      if (!retryableError || attempt >= retries - 1) {
        throw error
      }
      
      // Exponential backoff before retrying
      const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 8000)
      await new Promise(resolve => setTimeout(resolve, backoffDelay))
    }
  }
  
  throw lastError || new Error('Query failed after all retries')
}

// Transaction helper with automatic rollback on error
export async function withTransaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}