import { Pool, PoolClient } from 'pg'
import { DatabaseMonitor } from './db-monitor'
import { CacheService } from './cache'
import { DbMetrics } from './database.types'

// Define PostgreSQL error interface
interface PostgresError extends Error {
  code?: string;
  constraint?: string;
  detail?: string;
  schema?: string;
  table?: string;
  column?: string;
}

export class DatabaseService {
  private static instance: DatabaseService
  private pool: Pool
  private monitor: DatabaseMonitor
  private cache: CacheService

  private constructor(pool: Pool) {
    this.pool = pool
    this.monitor = DatabaseMonitor.getInstance()
    this.cache = CacheService.getInstance()
  }

  static getInstance(pool?: Pool): DatabaseService {
    if (!DatabaseService.instance && pool) {
      DatabaseService.instance = new DatabaseService(pool)
    }
    if (!DatabaseService.instance) {
      throw new Error('DatabaseService not initialized')
    }
    return DatabaseService.instance
  }

  // Full text search for profiles
  async searchProfiles(query: string, options: {
    limit?: number
    offset?: number
    role?: string
    paymentStatus?: string
    accreditationStatus?: string
  } = {}): Promise<any[]> {
    const {
      limit = 10,
      offset = 0,
      role,
      paymentStatus,
      accreditationStatus
    } = options

    const cacheKey = `search:${query}:${JSON.stringify(options)}`
    const cached = await this.cache.get(cacheKey)
    if (cached) return cached as any []

    const conditions = ['search_vector @@ plainto_tsquery($1)']
    const params: any[] = [query]
    let paramCount = 1

    if (role) {
      conditions.push(`role = $${++paramCount}`)
      params.push(role)
    }
    if (paymentStatus) {
      conditions.push(`payment_status = $${++paramCount}`)
      params.push(paymentStatus)
    }
    if (accreditationStatus) {
      conditions.push(`accreditation_status = $${++paramCount}`)
      params.push(accreditationStatus)
    }

    const result = await this.pool.query(`
      SELECT *,
        ts_rank_cd(search_vector, plainto_tsquery($1)) as rank
      FROM profiles
      WHERE ${conditions.join(' AND ')}
      ORDER BY rank DESC
      LIMIT $${++paramCount}
      OFFSET $${++paramCount}
    `, [...params, limit, offset])

    await this.cache.set(cacheKey, result.rows, 300) // Cache for 5 minutes
    return result.rows
  }

  // Transaction with automatic retry
  async withTransaction<T>(
    callback: (client: PoolClient) => Promise<T>,
    retries: number = 3
  ): Promise<T> {
    let lastError: PostgresError | null = null;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      const client = await this.pool.connect();
      
      try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
      } catch (err) {
        const error = err as PostgresError;
        await client.query('ROLLBACK');
        lastError = error;
        
        // Check if error is retryable
        if (
          error.code === '40001' || // Serialization failure
          error.code === '40P01' || // Deadlock detected
          error.code === '55P03'    // Lock not available
        ) {
          await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
          continue;
        }
        
        throw error;
      } finally {
        client.release();
      }
    }
    
    throw lastError || new Error('Transaction failed after retries');
  }

  // Batch operations with cursor
  async* batchProcess<T>(
    query: string,
    params: any[],
    batchSize: number = 1000
  ): AsyncGenerator<T[]> {
    const client = await this.pool.connect()
    
    try {
      await client.query('BEGIN')
      await client.query('DECLARE batch_cursor CURSOR FOR ' + query, params)
      
      while (true) {
        const result = await client.query(
          'FETCH $1 FROM batch_cursor',
          [batchSize]
        )
        
        if (result.rows.length === 0) break
        yield result.rows
      }
      
      await client.query('CLOSE batch_cursor')
      await client.query('COMMIT')
    } catch (err) {
      const error = err as Error
      console.error('Error in batch processing:', error)
      throw error
    } finally {
      client.release()
    }
  }

  // Upsert helper
  async upsert(
    table: string,
    data: Record<string, any>,
    uniqueKeys: string[],
    returning: string[] = ['*']
  ): Promise<any> {
    const columns = Object.keys(data)
    const values = Object.values(data)
    const placeholders = values.map((_, i) => `$${i + 1}`)
    
    const insertPart = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
    `
    
    const updatePart = `
      UPDATE SET ${columns
        .filter(col => !uniqueKeys.includes(col))
        .map((col, i) => `${col} = EXCLUDED.${col}`)
        .join(', ')}
    `
    
    const conflictPart = `
      ON CONFLICT (${uniqueKeys.join(', ')})
      ${columns.length > uniqueKeys.length ? updatePart : 'DO NOTHING'}
    `
    
    const query = `
      ${insertPart}
      ${conflictPart}
      RETURNING ${returning.join(', ')}
    `
    
    const result = await this.pool.query(query, values)
    return result.rows[0]
  }

  // Metrics collection
  async getMetrics(): Promise<DbMetrics> {
    const [metrics, poolState] = await Promise.all([
      this.monitor.getMetrics(),
      this.monitor.getPoolState()
    ])

    return {
      ...metrics,
      ...poolState
    }
  }

  // Health check with detailed diagnostics
  async checkHealth(): Promise<Record<string, any>> {
    try {
      const [dbHealth, cacheHealth, metrics] = await Promise.all([
        this.pool.query('SELECT 1'),
        this.cache.ping(),
        this.getMetrics()
      ])

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        postgresConnected: true,
        redisConnected: cacheHealth,
        metrics
      }
    } catch (error: any) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        postgresConnected: false,
        redisConnected: false
      }
    }
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    await this.pool.end()
  }
}