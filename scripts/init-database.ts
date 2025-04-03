import { PrismaClient } from '@prisma/client'
import { initializeDefaultConfig } from '../lib/config-service'

const prisma = new PrismaClient()

async function initializeDatabase() {
  try {
    console.log('Starting database initialization...')

    // Test database connection
    await prisma.$connect()
    console.log('Database connection successful')

    // Check if tables exist by attempting to query them
    const tableChecks = await Promise.allSettled([
      prisma.config.findFirst(),
      prisma.user.findFirst(),
      prisma.participant.findFirst(),
      prisma.validator.findFirst(),
      prisma.admin.findFirst()
    ])

    const tableStatus = {
      Config: tableChecks[0].status === 'fulfilled',
      User: tableChecks[1].status === 'fulfilled',
      Participant: tableChecks[2].status === 'fulfilled',
      Validator: tableChecks[3].status === 'fulfilled',
      Admin: tableChecks[4].status === 'fulfilled'
    }

    console.log('Table status:', tableStatus)

    // Initialize default configuration if config table exists
    if (tableStatus.Config) {
      await initializeDefaultConfig()
      console.log('Default configuration initialized')
    }

    console.log('Database initialization completed successfully')
  } catch (error) {
    console.error('Database initialization failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

initializeDatabase()