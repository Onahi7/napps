import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { env } from './env'
import { DatabaseMonitor } from './db-monitor'
import { prisma } from './db'

// Type guard to check if an error has required properties
function isDbError(error: unknown): error is { message: string; code?: string; detail?: string } {
  return error instanceof Error || 
    (typeof error === 'object' && 
     error !== null && 
     'message' in error)
}

export async function verifyDatabaseConnection() {
  let dbUrl = env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  // Log redacted connection string for debugging
  const redactedUrl = dbUrl.replace(/\/\/[^:]+:[^@]+@/, '//[USERNAME]:[PASSWORD]@');
  console.log('Attempting database connection with:', redactedUrl);

  try {
    console.log('Testing Prisma connection...');
    // Test Prisma connection first
    await prisma.$connect();
    console.log('Prisma connection successful');

    // Verify key tables exist and are accessible
    console.log('Verifying database schema...');
    await Promise.all([
      prisma.user.count(),
      prisma.participant.count(),
      prisma.validator.count(),
      prisma.admin.count(),
      prisma.config.count()
    ]);
    console.log('Schema verification successful');

    // Test system-level pool connection for maintenance operations
    console.log('Testing system pool connection...');
    const monitor = DatabaseMonitor.getInstance();
    const isHealthy = await monitor.checkHealth();
    
    if (!isHealthy) {
      throw new Error('System pool health check failed');
    }
    console.log('System pool connection successful');

    return {
      success: true,
      message: 'Database connection verified successfully'
    };
  } catch (error) {
    let errorMessage = 'Database connection verification failed';

    if (isDbError(error)) {
      errorMessage = `${errorMessage}: ${error.message}`;
      if ('code' in error && error.code) {
        errorMessage += ` (Code: ${error.code})`;
      }
      if ('detail' in error && error.detail) {
        errorMessage += ` - ${error.detail}`;
      }
    }

    console.error(errorMessage);
    throw new Error(errorMessage);
  }
}