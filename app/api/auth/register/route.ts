'use server'

import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { PoolClient } from 'pg'
import { pool, query, withTransaction } from '@/lib/db'
import { generateParticipantReference } from '@/lib/utils/reference-generator'

// Registration schema matching database structure
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
    .transform(val => val.replace(/\D/g, ''))
    .refine(val => val.length >= 10 && val.length <= 15, 
      "Please enter a valid phone number (10-15 digits)"),
  school_name: z.string().min(1, "School name is required"),
  school_address: z.string().optional(),
  school_state: z.string().min(1, "School state is required"),
  napps_chapter: z.string().min(1, "NAPPS chapter is required")
})

export async function POST(req: NextRequest) {
  console.log('Starting registration process...');
  
  try {
    // Test database connection first
    try {
      await query('SELECT 1');
    } catch (err) {
      console.error('Database connection test failed:', err);
      return NextResponse.json({
        success: false,
        error: 'Unable to connect to the registration system. Please try again in a few minutes.'
      }, { status: 503 });
    }

    const body = await req.json();
    console.log('Processing registration data:', { ...body, password: '[REDACTED]' });

    const validationResult = registrationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Please check your form entries',
        details: validationResult.error.issues
      }, { status: 400 });
    }

    const data = validationResult.data;
    const passwordHash = await hash(data.password, 12);
    const referenceCode = generateParticipantReference();

    // Check for existing user before transaction
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [data.email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'This email is already registered. Please login instead.'
      }, { status: 409 });
    }

    // Create user and profile in a transaction
    const userId = await withTransaction(async (client: PoolClient) => {
      // Create user first
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())
         RETURNING id`,
        [data.email, passwordHash]
      );

      const userId = userResult.rows[0].id;

      // Create profile with reference code
      await client.query(
        `INSERT INTO profiles (
          id, email, full_name, phone,
          school_name, school_address, school_state, napps_chapter,
          reference_code, role, payment_status, accreditation_status,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())`,
        [
          userId,
          data.email,
          data.full_name,
          data.phone,
          data.school_name,
          data.school_address || '',
          data.school_state,
          data.napps_chapter,
          referenceCode,
          'participant',
          'pending',
          'pending'
        ]
      );

      return userId;
    }, 3); // Try up to 3 times

    console.log('Registration successful:', { userId });

    return NextResponse.json({
      success: true,
      data: { id: userId }
    });

  } catch (error: any) {
    console.error('Registration error:', error);

    // Handle specific database errors
    if (error.code === '23505') { // Unique violation
      if (error.constraint?.includes('email')) {
        return NextResponse.json({
          success: false,
          error: 'This email is already registered. Please login instead.'
        }, { status: 409 });
      }
      if (error.constraint?.includes('phone')) {
        return NextResponse.json({
          success: false,
          error: 'This phone number is already registered. Please use a different number.'
        }, { status: 409 });
      }
    }

    // Handle connection errors
    if (error.message?.includes('connect') || error.message?.includes('timeout')) {
      return NextResponse.json({
        success: false,
        error: 'Unable to complete registration due to connection issues. Please try again.'
      }, { status: 503 });
    }

    // Generic error response
    return NextResponse.json({
      success: false,
      error: 'Registration failed. Please try again or contact support if the problem persists.'
    }, { status: 500 });
  }
}