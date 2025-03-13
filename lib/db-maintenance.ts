import { Pool } from 'pg'
import { DatabaseMonitor } from './db-monitor'

export class DatabaseMaintenance {
  private pool: Pool
  private monitor: DatabaseMonitor

  constructor(pool: Pool) {
    this.pool = pool
    this.monitor = DatabaseMonitor.getInstance()
  }

  async vacuumAnalyze(): Promise<void> {
    const client = await this.pool.connect()
    try {
      // Disable statement timeout for maintenance operations
      await client.query('SET statement_timeout = 0')
      
      // Get list of tables
      const tables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `)

      // Vacuum analyze each table
      for (const table of tables.rows) {
        await client.query(`VACUUM ANALYZE ${table.table_name}`)
      }
    } finally {
      client.release()
    }
  }

  async reindexTables(): Promise<void> {
    const client = await this.pool.connect()
    try {
      await client.query('SET statement_timeout = 0')
      await client.query('REINDEX DATABASE CONCURRENTLY CURRENT_DATABASE')
    } finally {
      client.release()
    }
  }

  async cleanupOldScans(daysToKeep: number = 30): Promise<void> {
    await this.pool.query(
      'DELETE FROM scans WHERE created_at < NOW() - INTERVAL \'$1 days\'',
      [daysToKeep]
    )
  }

  async optimizeSearchVectors(): Promise<void> {
    await this.pool.query(`
      UPDATE profiles 
      SET search_vector = 
        setweight(to_tsvector('english', COALESCE(full_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(email, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(organization, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(state, '')), 'D') ||
        setweight(to_tsvector('english', COALESCE(chapter, '')), 'D')
      WHERE search_vector IS NULL OR updated_at > 
        (SELECT MAX(created_at) FROM scans WHERE user_id = profiles.id)
    `)
  }

  async getTableStats(): Promise<Record<string, any>> {
    const stats = await this.pool.query(`
      SELECT 
        schemaname,
        relname as table_name,
        n_live_tup as row_count,
        n_dead_tup as dead_tuples,
        last_vacuum,
        last_autovacuum,
        last_analyze,
        last_autoanalyze
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY n_live_tup DESC
    `)

    return stats.rows
  }

  async getDatabaseSize(): Promise<Record<string, any>> {
    const size = await this.pool.query(`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as total_size,
        pg_size_pretty(pg_total_relation_size('users')) as users_size,
        pg_size_pretty(pg_total_relation_size('profiles')) as profiles_size,
        pg_size_pretty(pg_total_relation_size('scans')) as scans_size,
        pg_size_pretty(pg_total_relation_size('bookings')) as bookings_size
    `)

    return size.rows[0]
  }

  async getConnectionStats(): Promise<Record<string, any>> {
    const stats = await this.pool.query(`
      SELECT 
        count(*) as total_connections,
        count(*) filter (where state = 'active') as active_connections,
        count(*) filter (where state = 'idle') as idle_connections,
        count(*) filter (where wait_event_type is not null) as waiting_connections
      FROM pg_stat_activity
      WHERE datname = current_database()
    `)

    return {
      ...stats.rows[0],
      ...await this.monitor.getPoolState()
    }
  }

  async killIdleConnections(): Promise<void> {
    await this.pool.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = current_database()
        AND state = 'idle'
        AND pid != pg_backend_pid()
        AND state_change < NOW() - INTERVAL '1 hour'
    `)
  }

  async resetPoolConnections(): Promise<void> {
    await this.pool.end()
    await new Promise(resolve => setTimeout(resolve, 1000))
    await this.pool.connect() // Test new connection
  }

  async runMaintenance(): Promise<void> {
    try {
      await this.killIdleConnections()
      await this.vacuumAnalyze()
      await this.optimizeSearchVectors()
      await this.cleanupOldScans()
    } catch (error) {
      console.error('Database maintenance failed:', error)
      throw error
    }
  }
}