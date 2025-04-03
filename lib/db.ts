import { Pool } from 'pg'
import { env } from './env'
import { DatabaseMonitor } from './db-monitor'
import { PrismaClient } from '@prisma/client'

// Check if code is running on the server
const isServer = typeof window === 'undefined'
if (!isServer) {
  throw new Error('Database operations can only be performed on the server')
}

// Initialize Prisma client
export const prisma = new PrismaClient({
  log: ['error', 'warn'],
  errorFormat: 'pretty'
})

// Create minimal PostgreSQL pool for system-level operations
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DATABASE_SSL ? {
    rejectUnauthorized: false
  } : false,
  // Minimal pool settings since Prisma handles most operations
  max: 3,
  min: 0,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  statement_timeout: 30000,
  query_timeout: 15000,
  application_name: 'napps_summit_system',
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
})

// Initialize monitoring
const monitor = DatabaseMonitor.getInstance(pool)

// General query helper for config and system operations
export async function query(text: string, params?: any[]) {
  const start = Date.now()
  try {
    const result = await pool.query(text, params)
    const duration = Date.now() - start
    monitor.recordQuery(duration)
    return result
  } catch (error) {
    monitor.recordError(error as Error)
    throw error
  }
}

// System-level query helper (only for maintenance/monitoring)
export async function systemQuery(text: string, params?: any[]) {
  return query(text, params)
}

// Health check function
export async function checkDatabaseHealth() {
  try {
    // Check both Prisma and system pool
    await Promise.all([
      prisma.$queryRaw`SELECT 1`,
      pool.query('SELECT 1')
    ])
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}

// Get database metrics
export async function getDatabaseMetrics() {
  return {
    metrics: await monitor.getMetrics(),
    poolState: await monitor.getPoolState()
  }
}

// Graceful shutdown helper
export async function closeDatabase() {
  await Promise.all([
    prisma.$disconnect(),
    pool.end()
  ])
}