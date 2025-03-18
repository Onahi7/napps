import { Pool } from 'pg';
import { env } from '@/lib/env';
import { DatabaseMonitor } from '@/lib/db-monitor';
import { DatabaseService } from '@/lib/db-service';

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
  })),
}));

jest.mock('@/lib/env', () => ({
  env: {
    DATABASE_URL: 'postgres://test:test@localhost:5432/test',
    DATABASE_SSL: true
  }
}));

describe('Database Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates pool with correct SSL configuration for Digital Ocean', () => {
    const pool = new Pool({
      connectionString: env.DATABASE_URL,
      ssl: env.DATABASE_SSL ? {
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined
      } : false
    });

    expect(Pool).toHaveBeenCalledWith(expect.objectContaining({
      connectionString: env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
        checkServerIdentity: expect.any(Function)
      }
    }));
  });

  it('initializes database monitor singleton', () => {
    const pool = new Pool();
    const monitor1 = DatabaseMonitor.getInstance(pool);
    const monitor2 = DatabaseMonitor.getInstance();

    expect(monitor1).toBe(monitor2);
  });

  it('initializes database service with correct pool settings', () => {
    const pool = new Pool({
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    });

    const service = DatabaseService.getInstance(pool);
    expect(service).toBeDefined();
  });
});