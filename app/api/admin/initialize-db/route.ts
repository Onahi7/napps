import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { verifyDatabaseConnection } from '@/lib/db-config'
import { PrismaClient } from '@prisma/client'
import { initializeDefaultConfig } from '@/lib/config-service'

const prisma = new PrismaClient()

// Define a type for the table status results
interface TableStatus {
  Config: boolean;
  User: boolean;
  Participant: boolean;
  Validator: boolean;
  Admin: boolean;
  [key: string]: boolean;
}

export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated for security
    const session = await getServerSession(authOptions)
    
    // Only allow admin users to initialize database in production
    if (process.env.NODE_ENV === 'production' && 
        (!session || session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 403 }
      )
    }

    // Step 1: Check database connection
    const connectionStatus = await verifyDatabaseConnection()
    
    if (!connectionStatus.success) {
      return NextResponse.json({
        success: false,
        message: 'Database connection failed. Cannot initialize database.',
        details: connectionStatus.message
      }, { status: 500 })
    }

    // Step 2: Check if tables exist by attempting to query them
    const tableStatus: TableStatus = {
      Config: false,
      User: false,
      Participant: false,
      Validator: false,
      Admin: false
    }

    try {
      await prisma.config.findFirst()
      tableStatus.Config = true
    } catch {}

    try {
      await prisma.user.findFirst()
      tableStatus.User = true
    } catch {}

    try {
      await prisma.participant.findFirst()
      tableStatus.Participant = true
    } catch {}

    try {
      await prisma.validator.findFirst()
      tableStatus.Validator = true
    } catch {}

    try {
      await prisma.admin.findFirst()
      tableStatus.Admin = true
    } catch {}

    // Step 3: Initialize default configuration if config table exists
    let configInitialized = false
    if (tableStatus.Config) {
      await initializeDefaultConfig()
      configInitialized = true
    }
    
    // Return results
    return NextResponse.json({
      success: true,
      message: 'Database status check completed',
      details: {
        connectionStatus,
        tableStatus,
        configInitialized
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('Database initialization error:', error)
    return NextResponse.json({
      success: false,
      message: 'Database initialization failed',
      error: errorMessage
    }, { status: 500 })
  }
}