import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { isAdmin } from '@/lib/auth'
import { DatabaseMaintenance } from '@/lib/db-maintenance'

// Maintenance error type
interface MaintenanceError extends Error {
  code?: string;
  details?: unknown;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify admin access
    const admin = await isAdmin(session.user.id)
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    const maintenance = DatabaseMaintenance.getInstance()
    const status = await maintenance.checkStatus()

    return NextResponse.json({
      status: 'success',
      data: status,
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    const error = err as MaintenanceError;
    console.error('Maintenance status check error:', error)
    return NextResponse.json({
      status: 'error',
      message: error.message,
      details: error.details
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify admin access
    const admin = await isAdmin(session.user.id)
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    const { action } = await req.json()
    if (!action) {
      return NextResponse.json({
        status: 'error',
        message: 'Maintenance action is required'
      }, { status: 400 })
    }

    const maintenance = DatabaseMaintenance.getInstance()

    switch (action) {
      case 'vacuum':
        await maintenance.vacuumAnalyze()
        break
      case 'reindex':
        await maintenance.reindexTables()
        break
      case 'cleanup_old':
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
  } catch (err) {
    const error = err as MaintenanceError;
    console.error('Maintenance API error:', error)
    return NextResponse.json({
      status: 'error',
      message: error.message,
      details: error.details
    }, { status: 500 })
  }
}