import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { PoolClient } from 'pg'
import { pool } from '@/lib/db'
import { DatabaseService } from '@/lib/db-service'

// Input validation schema
const registrationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(2),
  phone: z.string().regex(/^\d{10,11}$/),
  state: z.string().optional(),
  lga: z.string().optional(),
  chapter: z.string().optional(),
  organization: z.string().optional(),
  position: z.string().optional(),
})

// Initialize database service using existing pool
const dbService = DatabaseService.getInstance(pool)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = registrationSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input data',
        details: result.error.issues
      }, { status: 400 })
    }

    const data = result.data
    const passwordHash = await hash(data.password, 12)

    // Use transaction to ensure both user and profile are created
    const userId = await dbService.withTransaction(async (client: PoolClient) => {
      // Create user record
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash)
         VALUES ($1, $2)
         RETURNING id`,
        [data.email.toLowerCase(), passwordHash]
      )

      const userId = userResult.rows[0].id

      // Create profile record
      await client.query(
        `INSERT INTO profiles (
          id, email, full_name, phone, role,
          state, lga, chapter, organization, position,
          payment_status, accreditation_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          userId,
          data.email.toLowerCase(),
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
  } catch (error: any) {
    console.error('Registration error:', error)

    // Handle unique constraint violations
    if (error.code === '23505') {
      if (error.constraint === 'idx_profiles_email') {
        return NextResponse.json({
          success: false,
          error: 'Email already registered'
        }, { status: 409 })
      }
      if (error.constraint === 'idx_profiles_phone') {
        return NextResponse.json({
          success: false,
          error: 'Phone number already registered'
        }, { status: 409 })
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Registration failed'
    }, { status: 500 })
  }
}