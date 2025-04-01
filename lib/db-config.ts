import { PrismaClient } from '@prisma/client'

export async function setupNeonPostgres() {
  const neonUrl = process.env.DATABASE_URL

  if (!neonUrl) {
    throw new Error('DATABASE_URL environment variable is required')
  }

  // Verify the URL is for Neon
  if (!neonUrl.includes('.neon.tech')) {
    console.warn('Warning: DATABASE_URL does not appear to be a Neon PostgreSQL URL')
  }

  try {
    // Test the connection
    const prisma = new PrismaClient()
    await prisma.$connect()
    await prisma.$disconnect()
    
    console.log('Successfully connected to Neon PostgreSQL')
    return true
  } catch (error) {
    console.error('Failed to connect to Neon PostgreSQL:', error)
    throw error
  }
}