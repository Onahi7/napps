import { Pool } from 'pg'
import { env } from './env'
import { DatabaseMonitor } from './db-monitor'

// Disable native PG module to ensure compatibility
process.env.NODE_PG_FORCE_NATIVE = 'false'

// Create PostgreSQL connection pool with optimized settings for DigitalOcean
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DATABASE_SSL ? {
    rejectUnauthorized: false,  // Always allow self-signed certificates
    checkServerIdentity: () => undefined  // Skip hostname check
  } : false,
  // Reduced connection pool for better Next.js compatibility
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  statement_timeout: 30000,
  query_timeout: 5000,
  application_name: 'napps_summit',
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
})

// Initialize database monitoring
const monitor = DatabaseMonitor.getInstance(pool)

// Helper to get a client from the pool with error handling
export async function getClient() {
  const client = await pool.connect()
  const release = client.release.bind(client)

  // Override release method to catch errors
  client.release = () => {
    client.release = release
    return release()
  }

  return client
}

// Helper for single queries
export async function query(text: string, params?: any[]) {
  const start = Date.now()
  try {
    const result = await pool.query(text, params)
    const duration = Date.now() - start

    // Log slow queries (over 1 second)
    if (duration > 1000) {
      console.warn('Slow query:', { text, duration, rows: result.rowCount })
    }

    return result
  } catch (error: any) {
    console.error('Query error:', { text, error: error.message })
    throw error
  }
}

// Transaction helper with automatic rollback on error
export async function withTransaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await getClient()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

// Health check function
export async function checkDatabaseHealth() {
  return await monitor.checkHealth()
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