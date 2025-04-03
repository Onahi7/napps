import { NextRequest, NextResponse } from 'next/server'
import { checkDatabaseConnection, checkRequiredTables } from '@/lib/db-monitor'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated for security
    const session = await getServerSession(authOptions)
    
    // For this diagnostic endpoint, we'll allow access in development
    // but restrict in production unless authenticated as admin
    if (process.env.NODE_ENV === 'production' && 
        (!session || session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 403 }
      )
    }

    // Check database connection
    const connectionStatus = await checkDatabaseConnection()
    
    // If connected, check required tables
    let tableStatus = null
    if (connectionStatus.connected) {
      tableStatus = await checkRequiredTables()
    }

    // Return diagnostic information
    return NextResponse.json({
      databaseStatus: connectionStatus,
      tableStatus,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? 
          process.env.DATABASE_URL.replace(/postgres:\/\/.*:(.*)@/, 'postgres://****:****@') : 
          'Not set',
        directUrl: process.env.DIRECT_URL ? 
          process.env.DIRECT_URL.replace(/postgres:\/\/.*:(.*)@/, 'postgres://****:****@') : 
          'Not set',
      }
    })
  } catch (error) {
    console.error('Database diagnostics error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error occurred'
    return NextResponse.json(
      { error: 'Failed to check database status', details: errorMessage }, 
      { status: 500 }
    )
  }
}