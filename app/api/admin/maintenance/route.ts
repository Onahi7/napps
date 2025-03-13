import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { DatabaseService } from '@/lib/db-service'
import { DatabaseMaintenance } from '@/lib/db-maintenance'
import { Pool } from 'pg'
import { env } from '@/lib/env'
import { z } from 'zod'

const maintenanceActionSchema = z.object({
  action: z.enum(['vacuum', 'reindex', 'cleanup', 'optimize', 'kill_idle', 'reset_pool', 'full_maintenance'])
})

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DATABASE_SSL ? {
    rejectUnauthorized: false
  } : false
})

const dbService = DatabaseService.getInstance(pool)
const maintenance = new DatabaseMaintenance(pool)

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Verify admin role
    const searchResult = await dbService.searchProfiles(session.user.id, {
      role: 'admin',
      limit: 1
    })

    if (!searchResult.length) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    // Get database statistics
    const [tableStats, dbSize, connStats] = await Promise.all([
      maintenance.getTableStats(),
      maintenance.getDatabaseSize(),
      maintenance.getConnectionStats()
    ])

    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      statistics: {
        tables: tableStats,
        size: dbSize,
        connections: connStats
      }
    })
  } catch (error: any) {
    console.error('Maintenance API error:', error)
    return NextResponse.json({
      status: 'error',
      message: error.message
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Verify admin role
    const searchResult = await dbService.searchProfiles(session.user.id, {
      role: 'admin',
      limit: 1
    })

    if (!searchResult.length) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const data = await req.json()
    
    // Validate the request data
    const result = maintenanceActionSchema.safeParse(data)
    if (!result.success) {
      return NextResponse.json({
        status: 'error',
        message: 'Invalid maintenance action'
      }, { status: 400 })
    }

    const { action } = result.data

    switch (action) {
      case 'vacuum':
        await maintenance.vacuumAnalyze()
        break
      case 'reindex':
        await maintenance.reindexTables()
        break
      case 'cleanup':
        await maintenance.cleanupOldScans()
        break
      case 'optimize':
        await maintenance.optimizeSearchVectors()
        break
      case 'kill_idle':
        await maintenance.killIdleConnections()
        break
      case 'reset_pool':
        await maintenance.resetPoolConnections()
        break
      case 'full_maintenance':
        await maintenance.runMaintenance()
        break
      default:
        return NextResponse.json({
          status: 'error',
          message: 'Invalid maintenance action'
        }, { status: 400 })
    }

    return NextResponse.json({
      status: 'success',
      message: `Maintenance action '${action}' completed successfully`,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Maintenance API error:', error)
    return NextResponse.json({
      status: 'error',
      message: error.message
    }, { status: 500 })
  }
}