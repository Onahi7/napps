import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { PoolClient } from 'pg'
import { pool, query, withTransaction } from '@/lib/db'
import { DatabaseService } from '@/lib/db-service'

// Database error types
interface PostgresError extends Error {
  code?: string
  constraint?: string
}

// More lenient input validation schema for non-technical users
const registrationSchema = z.object({
  email: z.string()
    .trim()
    .email("Please enter a valid email address")
    .transform(val => val.toLowerCase()),
  password: z.string()
    .min(6, "Password must be at least 6 characters"),
  full_name: z.string()
    .trim()
    .min(2, "Full name must be at least 2 characters"),
  phone: z.string()
    // More permissive phone validation - accepts formats like: 0801234567, 08012345678, +2348012345678
    .transform(val => val.replace(/\D/g, ''))
    .refine(val => val.length >= 10 && val.length <= 15, 
      "Please enter a valid phone number (10-15 digits)"),
  state: z.string().optional().default(""),
  lga: z.string().optional().default(""),
  chapter: z.string().optional().default(""),
  organization: z.string().optional().default(""),
  position: z.string().optional().default(""),
})

// Test database connection function
async function testDbConnection() {
  try {
    // Set a longer timeout for the connection test
    const result = await query('SELECT NOW() as time', undefined, 3);
    return { success: true, time: result.rows[0].time };
  } catch (err) {
    const error = err as Error;
    console.error('Database connection test failed:', error);
    return { success: false, error };
  }
}

// Initialize database service using existing pool
let dbService: DatabaseService;
try {
  dbService = DatabaseService.getInstance(pool);
} catch (err) {
  const error = err as Error;
  console.error('Failed to initialize DatabaseService:', error);
  // We'll handle this case in the POST handler
}

export async function POST(req: NextRequest) {
  try {
    // First, test the database connection
    const connectionTest = await testDbConnection();
    if (!connectionTest.success) {
      console.error('Database connection test failed before processing registration');
      return NextResponse.json({
        success: false,
        error: 'Unable to connect to the database. Please try again later.',
        details: { connectionTest: false }
      }, { status: 503 });
    }
    
    console.log('Database connection successful:', connectionTest);
    
    // Ensure dbService is initialized
    if (!dbService) {
      try {
        dbService = DatabaseService.getInstance(pool);
      } catch (err) {
        const error = err as Error;
        console.error('Failed to initialize DatabaseService during request:', error);
        return NextResponse.json({
          success: false,
          error: 'Internal service configuration error. Please try again later.',
        }, { status: 500 });
      }
    }
    
    const body = await req.json()
    
    // Log incoming request body for debugging (without password)
    const { password, ...logSafeData } = body;
    console.log('Registration request data:', logSafeData)
    
    const result = registrationSchema.safeParse(body)

    if (!result.success) {
      console.log('Validation error:', result.error.issues)
      return NextResponse.json({
        success: false,
        error: 'Please check your form entries',
        details: result.error.issues
      }, { status: 400 })
    }

    const data = result.data
    const passwordHash = await hash(data.password, 12)

    // Directly check for existing user or phone before transaction
    try {
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1',
        [data.email]
      );
      
      if (existingUser.rows.length > 0) {
        return NextResponse.json({
          success: false,
          error: 'This email is already registered. Please log in or use a different email.'
        }, { status: 409 });
      }
      
      const existingPhone = await query(
        'SELECT id FROM profiles WHERE phone = $1',
        [data.phone]
      );
      
      if (existingPhone.rows.length > 0) {
        return NextResponse.json({
          success: false,
          error: 'This phone number is already registered. Please log in or use a different number.'
        }, { status: 409 });
      }
    } catch (err) {
      const error = err as Error;
      console.error('Error checking for existing user:', error);
      // Continue to the transaction - we'll catch duplicates there if this check failed
    }

    // Use the improved withTransaction function from db.ts
    try {
      // Try a direct transaction rather than using dbService
      const userId = await withTransaction(async (client: PoolClient) => {
        // Create user record
        const userResult = await client.query(
          `INSERT INTO users (email, password_hash)
           VALUES ($1, $2)
           RETURNING id`,
          [data.email, passwordHash]
        )

        const userId = userResult.rows[0].id

        // Create profile record with better defaults for optional fields
        await client.query(
          `INSERT INTO profiles (
            id, email, full_name, phone, role,
            state, lga, chapter, organization, position,
            payment_status, accreditation_status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            userId,
            data.email,
            data.full_name,
            data.phone,
            'participant',
            data.state || null,
            data.lga || null,
            data.chapter || null,
            data.organization || null,
            data.position || null,
            'pending',
            'pending'
          ]
        )

        return userId
      });

      console.log('Registration successful, userId:', userId);
      
      return NextResponse.json({
        success: true,
        data: { id: userId }
      })
    } catch (err) {
      const error = err as PostgresError;
      console.error('Database transaction error:', error);
      
      // Handle unique constraint violations with clearer error messages
      if (error.code === '23505') {
        if (error.constraint === 'users_email_key' || 
            error.constraint === 'idx_profiles_email') {
          return NextResponse.json({
            success: false,
            error: 'This email is already registered. Please log in or use a different email.'
          }, { status: 409 })
        }
        if (error.constraint === 'idx_profiles_phone') {
          return NextResponse.json({
            success: false,
            error: 'This phone number is already registered. Please log in or use a different number.'
          }, { status: 409 })
        }
        
        // For any other constraint violations
        return NextResponse.json({
          success: false,
          error: 'This information is already in use. Please try with different details.'
        }, { status: 409 })
      }

      // Handle connection errors with a clear message
      if (error.message && (
          error.message.includes('connect') || 
          error.message.includes('timeout') ||
          error.message.includes('Connection terminated')
      )) {
        return NextResponse.json({
          success: false,
          error: 'Database connection failed. Please try again later.',
          details: { message: error.message }
        }, { status: 503 })
      }
      
      return NextResponse.json({
        success: false,
        error: 'Registration failed due to a database error. Please try again.',
        details: { 
          message: error.message,
          code: error.code,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }
      }, { status: 500 });
    }
  } catch (err) {
    const error = err as Error;
    console.error('Registration error:', error)

    // Return more user-friendly error message with details for debugging
    return NextResponse.json({
      success: false,
      error: 'Registration could not be completed. Please try again later.',
      details: { 
        message: error.message,
        type: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    }, { status: 500 })
  }
}