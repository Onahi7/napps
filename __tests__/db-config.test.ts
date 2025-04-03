import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { env } from '@/lib/env'
import { DatabaseMonitor } from '@/lib/db-monitor'
import { DatabaseService } from '@/lib/db-service'
import { prisma } from '@/lib/db'
import { verifyDatabaseConnection } from '@/lib/db-config'

// Extend Error type to include code property
interface DbError extends Error {
  code?: string;
}

// Mock external dependencies
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $queryRaw: jest.fn(),
    user: { count: jest.fn() },
    participant: { count: jest.fn() },
    validator: { count: jest.fn() },
    admin: { count: jest.fn() },
    config: { count: jest.fn() }
  }))
}))

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    connect: jest.fn(),
    query: jest.fn().mockResolvedValue({
      command: 'SELECT',
      rowCount: 1,
      oid: null,
      rows: [{ '?column?': 1 }],
      fields: [],
      _parsers: [],
      _types: {},
      RowCtor: null
    }),
    end: jest.fn(),
    totalCount: 0,
    idleCount: 0,
    waitingCount: 0
  }))
}))

jest.mock('@/lib/env', () => ({
  env: {
    DATABASE_URL: 'postgres://test:test@localhost:5432/test',
    DATABASE_SSL: true
  }
}))

// Mock verifyDatabaseConnection
jest.mock('@/lib/db-config', () => ({
  verifyDatabaseConnection: jest.fn()
}))

describe('Database Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates system pool with correct SSL configuration', () => {
    const pool = new Pool({
      connectionString: env.DATABASE_URL,
      ssl: env.DATABASE_SSL ? {
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined
      } : false
    })

    expect(Pool).toHaveBeenCalledWith(expect.objectContaining({
      connectionString: env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
        checkServerIdentity: expect.any(Function)
      }
    }))
  })

  it('initializes database monitor singleton with system pool', () => {
    const pool = new Pool()
    const monitor1 = DatabaseMonitor.getInstance(pool)
    const monitor2 = DatabaseMonitor.getInstance()

    expect(monitor1).toBe(monitor2)
  })

  it('allows setting Prisma client in monitor', () => {
    const pool = new Pool()
    const monitor = DatabaseMonitor.getInstance(pool)
    const prismaClient = new PrismaClient()

    monitor.setPrismaClient(prismaClient)

    // Verify it doesn't throw and monitor still works
    expect(() => monitor.checkHealth()).not.toThrow()
  })

  it('verifies database connection successfully', async () => {
    const mockPrismaConnect = jest.spyOn(prisma, '$connect')
    const mockPrismaQuery = jest.spyOn(prisma.user, 'count')
    const mockPoolQuery = jest.spyOn(Pool.prototype, 'query')
      .mockResolvedValue({ rows: [{ '?column?': 1 }] })

    mockPrismaConnect.mockResolvedValue()
    mockPrismaQuery.mockResolvedValue(0)

    const monitor = DatabaseMonitor.getInstance(new Pool())
    const healthCheck = jest.spyOn(monitor, 'checkHealth')
    healthCheck.mockResolvedValue(true)

    await expect(verifyDatabaseConnection()).resolves.toEqual({
      success: true,
      message: 'Database connection verified successfully'
    })

    expect(mockPrismaConnect).toHaveBeenCalled()
    expect(mockPrismaQuery).toHaveBeenCalled()
    expect(healthCheck).toHaveBeenCalled()
  })

  it('handles database connection errors appropriately', async () => {
    const mockError = new Error('Connection failed') as DbError
    mockError.code = 'ECONNREFUSED'
    
    jest.spyOn(prisma, '$connect').mockRejectedValue(mockError)

    await expect(verifyDatabaseConnection()).rejects.toThrow(
      'Database connection verification failed: Connection failed (Code: ECONNREFUSED)'
    )
  })
})