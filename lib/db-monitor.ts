import { Pool } from 'pg'
import { DbMetrics, PoolState } from './database.types'
import { PrismaClient } from '@prisma/client'

export async function checkDatabaseConnection() {
  try {
    const monitor = DatabaseMonitor.getInstance()
    const isHealthy = await monitor.checkHealth()
    return {
      connected: isHealthy,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
  }
}

export async function checkRequiredTables() {
  try {
    const monitor = DatabaseMonitor.getInstance()
    const pool = monitor['pool'] // Access the private pool instance
    
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name IN ('users', 'profiles', 'scans', 'assignments')
    `)
    
    const requiredTables = ['users', 'profiles', 'scans', 'assignments']
    const existingTables = tables.rows.map(row => row.table_name)
    const missingTables = requiredTables.filter(table => !existingTables.includes(table))
    
    return {
      verified: missingTables.length === 0,
      existingTables,
      missingTables,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
  }
}

export class DatabaseMonitor {
  private static instance: DatabaseMonitor;
  private pool: Pool;
  private prisma?: PrismaClient;
  private metrics: Map<string, number> = new Map();
  private lastError?: Error;
  private lastErrorTime?: Date;

  private constructor(pool: Pool) {
    this.pool = pool;
    this.initializeMetrics();
  }

  public static getInstance(pool?: Pool): DatabaseMonitor {
    if (!DatabaseMonitor.instance && pool) {
      DatabaseMonitor.instance = new DatabaseMonitor(pool);
    }
    if (!DatabaseMonitor.instance) {
      throw new Error('DatabaseMonitor not initialized');
    }
    return DatabaseMonitor.instance;
  }

  setPrismaClient(client: PrismaClient) {
    this.prisma = client;
  }

  private initializeMetrics(): void {
    this.metrics.set('totalQueries', 0);
    this.metrics.set('prismaQueries', 0);
    this.metrics.set('systemQueries', 0);
    this.metrics.set('slowQueries', 0);
    this.metrics.set('errors', 0);
    this.metrics.set('openConnections', 0);
    this.metrics.set('activeQueries', 0);
    this.metrics.set('waitingQueries', 0);
  }

  recordQuery(duration: number, isPrisma = false): void {
    this.metrics.set('totalQueries', (this.metrics.get('totalQueries') || 0) + 1);
    
    if (isPrisma) {
      this.metrics.set('prismaQueries', (this.metrics.get('prismaQueries') || 0) + 1);
    } else {
      this.metrics.set('systemQueries', (this.metrics.get('systemQueries') || 0) + 1);
    }

    if (duration > 1000) { // Queries taking more than 1 second
      this.metrics.set('slowQueries', (this.metrics.get('slowQueries') || 0) + 1);
    }
  }

  recordError(error: Error): void {
    this.lastError = error;
    this.lastErrorTime = new Date();
    this.metrics.set('errors', (this.metrics.get('errors') || 0) + 1);
  }

  async getMetrics(): Promise<DbMetrics> {
    const poolMetrics = {
      totalQueries: this.metrics.get('totalQueries') || 0,
      prismaQueries: this.metrics.get('prismaQueries') || 0,
      systemQueries: this.metrics.get('systemQueries') || 0,
      slowQueries: this.metrics.get('slowQueries') || 0,
      errors: this.metrics.get('errors') || 0,
      openConnections: this.metrics.get('openConnections') || 0,
      idleConnections: (this.metrics.get('openConnections') || 0) - (this.metrics.get('activeQueries') || 0),
      waitingQueries: this.metrics.get('waitingQueries') || 0,
      lastError: this.lastError,
      lastErrorTime: this.lastErrorTime
    };

    return poolMetrics;
  }

  async getPoolState(): Promise<PoolState> {
    return {
      totalCount: this.metrics.get('openConnections') || 0,
      idleCount: (this.metrics.get('openConnections') || 0) - (this.metrics.get('activeQueries') || 0),
      waitingCount: this.metrics.get('waitingQueries') || 0
    };
  }

  resetMetrics(): void {
    this.initializeMetrics();
    this.lastError = undefined;
    this.lastErrorTime = undefined;
  }

  updateConnectionCount(pool: Pool): void {
    if (pool.totalCount !== undefined) {
      this.metrics.set('openConnections', pool.totalCount);
    }
    if (pool.idleCount !== undefined) {
      this.metrics.set('activeQueries', pool.totalCount! - pool.idleCount);
    }
    if (pool.waitingCount !== undefined) {
      this.metrics.set('waitingQueries', pool.waitingCount);
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      // Check both Prisma and system pool if available
      if (this.prisma) {
        await Promise.all([
          this.prisma.$queryRaw`SELECT 1`,
          this.pool.query('SELECT 1')
        ]);
      } else {
        await this.pool.query('SELECT 1');
      }
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      this.recordError(error as Error);
      return false;
    }
  }
}