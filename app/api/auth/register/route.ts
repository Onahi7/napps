import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { PoolClient } from 'pg'
import { pool } from '@/lib/db'
import { DatabaseService } from '@/lib/db-service'

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

// Initialize database service using existing pool
const dbService = DatabaseService.getInstance(pool)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Log incoming request body for debugging
    console.log('Registration request data:', body)
    
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

    // Use transaction to ensure both user and profile are created
    try {
      const userId = await dbService.withTransaction(async (client: PoolClient) => {
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
      })

      return NextResponse.json({
        success: true,
        data: { id: userId }
      })
    } catch (dbError: any) {
      console.error('Database transaction error:', dbError)
      
      // Handle unique constraint violations with clearer error messages
      if (dbError.code === '23505') {
        if (dbError.constraint === 'users_email_key' || 
            dbError.constraint === 'idx_profiles_email') {
          return NextResponse.json({
            success: false,
            error: 'This email is already registered. Please log in or use a different email.'
          }, { status: 409 })
        }
        if (dbError.constraint === 'idx_profiles_phone') {
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
      if (dbError.message.includes('connect') || dbError.message.includes('timeout')) {
        return NextResponse.json({
          success: false,
          error: 'Connection to the database failed. Please try again later.'
        }, { status: 503 })
      }
      
      throw dbError; // Re-throw for general error handling
    }
  } catch (error: any) {
    console.error('Registration error:', error)

    // Return more user-friendly error message
    return NextResponse.json({
      success: false,
      error: 'Registration could not be completed at this time. Please try again later.',
      message: error.message,
      code: error.code
    }, { status: 500 })
  }
}