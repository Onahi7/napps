import { Pool } from 'pg'
import { DbMetrics, PoolState } from './database.types'

export class DatabaseMonitor {
  private static instance: DatabaseMonitor;
  private pool: Pool;

  private constructor(pool: Pool) {
    this.pool = pool;
  }

  static getInstance(pool?: Pool): DatabaseMonitor {
    if (!DatabaseMonitor.instance && pool) {
      DatabaseMonitor.instance = new DatabaseMonitor(pool);
    }
    if (!DatabaseMonitor.instance) {
      throw new Error('DatabaseMonitor not initialized');
    }
    return DatabaseMonitor.instance;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const startTime = Date.now();
      await this.pool.query('SELECT 1');
      const duration = Date.now() - startTime;
      
      // Log connection successful with timing
      console.log(`Database health check successful. Duration: ${duration}ms`);
      
      const { totalCount, idleCount, waitingCount } = this.pool;
      console.log(`Pool status - Total: ${totalCount}, Idle: ${idleCount}, Waiting: ${waitingCount}`);
      
      return true;
    } catch (err) {
      const error = err as Error;
      console.error('Database health check failed:', {
        message: error.message,
        code: (error as any).code,
        name: error.name,
        stack: error.stack,
        poolStatus: {
          totalConnections: this.pool.totalCount,
          idleConnections: this.pool.idleCount,
          waitingClients: this.pool.waitingCount
        }
      });
      return false;
    }
  }

  private metrics: Map<string, number> = new Map();
  private lastError?: Error;
  private lastErrorTime?: Date;

  private initializeMetrics(): void {
    this.metrics.set('totalQueries', 0);
    this.metrics.set('slowQueries', 0);
    this.metrics.set('errors', 0);
    this.metrics.set('openConnections', 0);
  }

  recordQuery(duration: number): void {
    this.metrics.set('totalQueries', (this.metrics.get('totalQueries') || 0) + 1);
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
    return {
      totalConnections: this.metrics.get('openConnections') || 0,
      activeConnections: this.metrics.get('activeQueries') || 0,
      idleConnections: (this.metrics.get('openConnections') || 0) - (this.metrics.get('activeQueries') || 0),
      waitingQueries: this.metrics.get('waitingQueries') || 0,
      lastError: this.lastError,
      lastErrorTime: this.lastErrorTime
    }
  }

  async getPoolState(): Promise<PoolState> {
    return {
      totalCount: this.metrics.get('openConnections') || 0,
      idleCount: (this.metrics.get('openConnections') || 0) - (this.metrics.get('activeQueries') || 0),
      waitingCount: this.metrics.get('waitingQueries') || 0
    }
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
      this.metrics.set('activeQueries', pool.totalCount - pool.idleCount);
    }
    if (pool.waitingCount !== undefined) {
      this.metrics.set('waitingQueries', pool.waitingCount);
    }
  }
}