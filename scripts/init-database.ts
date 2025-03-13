import { Pool } from 'pg'
import { MigrationManager } from '../lib/migration-manager'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

async function initializeDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? {
      rejectUnauthorized: false
    } : false
  })

  try {
    console.log('Starting database initialization...')

    const migrationsDir = path.join(process.cwd(), 'migrations')
    const migrationManager = new MigrationManager(pool, migrationsDir)

    // Run migrations
    await migrationManager.migrate()

    console.log('Database initialization completed successfully')
  } catch (error) {
    console.error('Database initialization failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

initializeDatabase()

