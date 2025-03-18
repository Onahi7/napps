import { NextResponse } from 'next/server'
import { checkDatabaseHealth, getDatabaseMetrics } from '@/lib/db'
import { CacheService } from '@/lib/cache'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cache = CacheService.getInstance()
    const [dbHealth, redisHealth, dbMetrics] = await Promise.all([
      checkDatabaseHealth(),
      cache.ping(),
      getDatabaseMetrics()
    ])

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbHealth ? 'healthy' : 'unhealthy',
          metrics: dbMetrics
        },
        cache: {
          status: redisHealth ? 'healthy' : 'unhealthy'
        }
      }
    })
  } catch (error: any) {
    console.error('Health check failed:', error)
    return NextResponse.json({
      status: 'error',
      error: error.message
    }, { status: 500 })
  }
}