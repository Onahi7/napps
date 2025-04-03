import { PrismaClient } from '@prisma/client'
import { DatabaseMaintenance } from '../lib/db-maintenance'
import { CacheService } from '../lib/cache'

const prisma = new PrismaClient()
const cache = CacheService.getInstance()
const maintenance = DatabaseMaintenance.getInstance()

async function maintainDatabase() {
  try {
    console.log('Starting database maintenance...')

    // Get initial stats
    const [beforeStats, beforeSize] = await Promise.all([
      maintenance.getTableStats(),
      maintenance.getDatabaseSize()
    ])
    console.log('Initial database size:', beforeSize)

    // Run maintenance tasks
    console.log('\nRunning maintenance tasks...')
    await maintenance.runMaintenance()
    
    // Cleanup old cache entries
    await cache.flush()
    
    // Get final stats
    const [afterStats, afterSize] = await Promise.all([
      maintenance.getTableStats(),
      maintenance.getDatabaseSize()
    ])

    // Log results
    console.log('Maintenance completed successfully')
    console.log('Size before:', beforeSize)
    console.log('Size after:', afterSize)
    
    // Log detailed table statistics
    console.log('\nTable statistics:')
    afterStats.forEach((stat: any) => {
      const beforeStat = beforeStats.find((s: any) => s.table_name === stat.table_name)
      const deadTuplesDiff = beforeStat ? beforeStat.dead_tuples - stat.dead_tuples : 0
      
      console.log(`${stat.table_name}:`)
      console.log(`  Rows: ${stat.row_count}`)
      console.log(`  Dead tuples cleaned: ${deadTuplesDiff}`)
      console.log(`  Last vacuum: ${stat.last_vacuum || stat.last_autovacuum}`)
      console.log(`  Last analyze: ${stat.last_analyze || stat.last_autoanalyze}`)
    })
    
    // Check connection stats
    const connStats = await maintenance.getConnectionStats()
    console.log('\nConnection statistics:', connStats)

  } catch (error) {
    console.error('Maintenance failed:', error)
    process.exit(1)
  } finally {
    await Promise.all([
      prisma.$disconnect(),
      cache.close()
    ])
  }
}

maintainDatabase()