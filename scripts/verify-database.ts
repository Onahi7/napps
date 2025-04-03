import { PrismaClient } from '@prisma/client'
import { DatabaseMaintenance } from '../lib/db-maintenance'
import { pool } from '../lib/db'

const prisma = new PrismaClient()

async function verifyDatabase() {
  try {
    // Check Prisma connection
    console.log('\nChecking Prisma connection...')
    await prisma.$connect()
    console.log('Prisma connection successful')

    // Check database connection
    console.log('\nChecking database connection...')
    await pool.query('SELECT NOW()')
    console.log('Database connection successful')

    // Check models using Prisma schema metadata
    console.log('\nChecking Prisma models...')
    const models = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name IN ('User', 'Participant', 'Validator', 'Admin', 'Scan', 'Config')
      ORDER BY table_name
    `
    console.log('Existing models:')
    console.log(models)

    // Check config values using Prisma
    console.log('\nChecking configuration values...')
    const config = await prisma.config.findMany({
      select: {
        key: true,
        value: true
      }
    })
    console.log('Configuration values:')
    console.log(JSON.stringify(config, null, 2))

    // Use DatabaseMaintenance for advanced checks
    const maintenance = DatabaseMaintenance.getInstance()
    const status = await maintenance.checkStatus()
    
    console.log('\nDatabase Status:')
    console.log(JSON.stringify(status, null, 2))

    await prisma.$disconnect()
    await pool.end()

    console.log('\nDatabase verification completed successfully')
  } catch (err) {
    console.error('Error:', err)
    process.exit(1)
  }
}

verifyDatabase()