import { PrismaClient } from '@prisma/client'
import { DatabaseMonitor } from './db-monitor'
import { Pool } from 'pg'
import { pool } from './db'

export class DatabaseMaintenance {
  private static instance: DatabaseMaintenance;
  private prisma: PrismaClient;
  private pool: Pool;
  private monitor: DatabaseMonitor;

  private constructor() {
    this.prisma = new PrismaClient();
    this.pool = pool;
    this.monitor = DatabaseMonitor.getInstance();
  }

  public static getInstance(): DatabaseMaintenance {
    if (!DatabaseMaintenance.instance) {
      DatabaseMaintenance.instance = new DatabaseMaintenance();
    }
    return DatabaseMaintenance.instance;
  }

  async vacuumAnalyze(): Promise<void> {
    const client = await this.pool.connect()
    try {
      // Disable statement timeout for maintenance operations
      await client.query('SET statement_timeout = 0')
      
      // Get all Prisma model tables
      const tables = await this.prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `

      // Vacuum analyze each table
      for (const table of tables as any[]) {
        await client.query(`VACUUM ANALYZE "${table.table_name}"`)
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
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    await this.prisma.scan.deleteMany({
      where: {
        scannedAt: {
          lt: cutoffDate
        }
      }
    });
  }

  async getTableStats(): Promise<Record<string, any>[]> {
    // This still needs raw SQL as it accesses system tables
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
    // This still needs raw SQL as it accesses system functions
    const size = await this.pool.query(`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as total_size,
        pg_size_pretty(pg_table_size('"User"')) as users_size,
        pg_size_pretty(pg_table_size('"Participant"')) as participants_size,
        pg_size_pretty(pg_table_size('"Scan"')) as scans_size,
        pg_size_pretty(pg_table_size('"Accommodation"')) as accommodations_size
    `)

    return size.rows[0]
  }

  async getConnectionStats(): Promise<Record<string, any>> {
    // This still needs raw SQL as it accesses system tables
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
    // This still needs raw SQL for connection management
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
    await this.prisma.$disconnect();
    await this.pool.end();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.pool.connect();
    await this.prisma.$connect();
  }

  async optimizeSearchVectors(): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Disable statement timeout for maintenance operations
      await client.query('SET statement_timeout = 0');
      
      // Get tables with tsvector columns
      const vectorTables = await client.query(`
        SELECT DISTINCT c.table_name, c.column_name
        FROM information_schema.columns c
        JOIN information_schema.tables t 
          ON c.table_name = t.table_name
        WHERE c.data_type = 'tsvector'
          AND t.table_schema = 'public'
      `);

      // Reindex tsvector columns
      for (const row of vectorTables.rows) {
        await client.query(`
          REINDEX INDEX CONCURRENTLY (
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename = $1 
              AND indexdef LIKE '%tsvector%'
          )
        `, [row.table_name]);
      }
    } finally {
      client.release();
    }
  }

  async runMaintenance(): Promise<void> {
    try {
      await this.killIdleConnections();
      await this.vacuumAnalyze();
      await this.cleanupOldScans();
    } catch (error) {
      console.error('Database maintenance failed:', error);
      throw error;
    }
  }

  async checkStatus(): Promise<Record<string, any>> {
    try {
      const [size, stats, connections] = await Promise.all([
        this.getDatabaseSize(),
        this.getTableStats(),
        this.getConnectionStats()
      ]);

      return {
        size,
        tableStats: stats,
        connections,
        healthy: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Database status check failed:', error);
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }
}