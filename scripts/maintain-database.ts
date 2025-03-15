import { Pool } from 'pg'
import { DatabaseMaintenance } from '@/lib/db-maintenance'
import { CacheService } from '@/lib/cache'
import dotenv from 'dotenv'

dotenv.config()

async function maintainDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? {
      rejectUnauthorized: false
    } : false
  })

  // Use getInstance instead of constructor
  const maintenance = DatabaseMaintenance.getInstance()
  const cache = CacheService.getInstance()

  try {
    console.log('Starting database maintenance...')

    // Get initial stats
    const beforeStats = await maintenance.getTableStats()
    const beforeSize = await maintenance.getDatabaseSize()
    console.log('Initial database size:', beforeSize)

    // Run maintenance tasks
    await maintenance.runMaintenance()
    
    // Cleanup old cache entries
    await cache.flush()
    
    // Get final stats
    const afterStats = await maintenance.getTableStats()
    const afterSize = await maintenance.getDatabaseSize()
    
    console.log('Maintenance completed successfully')
    console.log('Size before:', beforeSize)
    console.log('Size after:', afterSize)
    
    // Log table statistics
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
    await pool.end()
  }
}

maintainDatabase()