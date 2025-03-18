'use server'

import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { PoolClient } from 'pg'
import { pool, query, withTransaction } from '@/lib/db'
import { generateParticipantReference } from '@/lib/utils/reference-generator'

// Add interface for database errors
interface DatabaseError extends Error {
  code?: string;
  constraint?: string;
  detail?: string;
  table?: string;  // Added to capture table name
  column?: string; // Added to capture column name
  schema?: string; // Added to capture schema information
}

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
    // Test database connection first with timeout
    try {
      const connectionTestPromise = query('SELECT 1');
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection test timed out')), 5000)
      );
      
      await Promise.race([connectionTestPromise, timeoutPromise]);
      console.log('Database connection test successful');
    } catch (err) {
      console.error('Database connection test failed:', err);
      return NextResponse.json({
        success: false,
        error: 'Unable to connect to the registration system. Please try again in a few minutes.',
        details: process.env.NODE_ENV === 'development' ? err : undefined
      }, { status: 503 });
    }

    const body = await req.json();
    console.log('Processing registration data:', { 
      email: body.email,
      full_name: body.full_name,
      phone: body.phone?.substring(0, 5) + '****', // Log partial phone for privacy
      school_name: body.school_name
    });

    const validationResult = registrationSchema.safeParse(body);
    if (!validationResult.success) {
      console.log('Validation failed:', validationResult.error.issues);
      return NextResponse.json({
        success: false,
        error: 'Please check your form entries',
        details: validationResult.error.issues
      }, { status: 400 });
    }

    const data = validationResult.data;
    console.log('Data validated successfully');
    
    const passwordHash = await hash(data.password, 12);
    const referenceCode = generateParticipantReference();
    console.log('Generated reference code:', referenceCode);

    // Check for existing user before transaction
    try {
      // First check the database is still responding
      await query('SELECT 1');
      
      console.log('Checking if email already exists:', data.email);
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1',
        [data.email]
      );

      if (existingUser.rows.length > 0) {
        console.log('Email already registered:', data.email);
        return NextResponse.json({
          success: false,
          error: 'This email is already registered. Please login instead.'
        }, { status: 409 });
      }
      
      // Check for phone number too
      console.log('Checking if phone already exists:', data.phone.substring(0, 5) + '****');
      const existingPhone = await query(
        'SELECT id FROM profiles WHERE phone = $1',
        [data.phone]
      );
      
      if (existingPhone.rows.length > 0) {
        console.log('Phone already registered');
        return NextResponse.json({
          success: false,
          error: 'This phone number is already registered. Please use a different number.'
        }, { status: 409 });
      }
    } catch (err: unknown) {
      console.error('Error checking for existing user:', err);
      // Check if it's a connection error
      const dbError = err as DatabaseError;
      if (dbError.message?.includes('connection') || dbError.message?.includes('timeout')) {
        return NextResponse.json({
          success: false,
          error: 'Database connection issue. Please try again in a few moments.'
        }, { status: 503 });
      }
      throw err; // Let the outer catch handle other types of errors
    }

    console.log('Starting user creation transaction');
    // Create user and profile in a transaction
    const userId = await withTransaction(async (client: PoolClient) => {
      // Create user first
      console.log('Creating user record');
      try {
        const userResult = await client.query(
          `INSERT INTO users (email, password_hash, created_at, updated_at)
           VALUES ($1, $2, NOW(), NOW())
           RETURNING id`,
          [data.email, passwordHash]
        );

        const userId = userResult.rows[0].id;
        console.log('User created with ID:', userId);

        // Generate a unique_id for the profile
        const uniqueId = `NAPPS-${Math.random().toString(36).substring(2, 10)}`;
        
        // Let's query the profiles table constraints to verify the allowed values
        const checkConstraints = await client.query(`
          SELECT conname, pg_get_constraintdef(oid) 
          FROM pg_constraint 
          WHERE conrelid = 'profiles'::regclass AND contype = 'c'
        `);
        console.log('Profile table constraints:', checkConstraints.rows);
        
        // Create profile with payment reference code
        console.log('Creating profile record');
        await client.query(
          `INSERT INTO profiles (
            id, email, full_name, phone,
            payment_reference, role, payment_status, accreditation_status,
            state, chapter, organization,
            school_name, school_address, school_state, napps_chapter,
            unique_id, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())`,
          [
            userId,
            data.email,
            data.full_name,
            data.phone,
            referenceCode,
            'participant',
            'pending',  // This must match the database constraint
            'pending',  // This must match the database constraint
            data.school_state,
            data.napps_chapter,
            data.school_name,
            data.school_name,
            data.school_address || '',
            data.school_state,
            data.napps_chapter,
            uniqueId
          ]
        );
        console.log('Profile created successfully');

        return userId;
      } catch (err: unknown) {
        const dbError = err as DatabaseError;
        console.error('Error in transaction:', {
          message: dbError.message,
          code: dbError.code,
          constraint: dbError.constraint,
          detail: dbError.detail,
          table: dbError.table,
          column: dbError.column,
          schema: dbError.schema
        });
        throw err;
      }
    }, 3); // Try up to 3 times

    console.log('Registration successful:', { userId });

    return NextResponse.json({
      success: true,
      data: { id: userId }
    });

  } catch (error: unknown) {
    const dbError = error as DatabaseError;
    console.error('Registration error details:', { 
      message: dbError.message, 
      code: dbError.code, 
      constraint: dbError?.constraint,
      detail: dbError?.detail,
      table: dbError?.table,
      column: dbError?.column,
      schema: dbError?.schema,
      stack: process.env.NODE_ENV === 'development' ? dbError.stack : undefined
    });

    // Handle specific database errors
    if (dbError.code === '23505') { // Unique violation
      if (dbError.constraint?.includes('email') || dbError.detail?.includes('email')) {
        return NextResponse.json({
          success: false,
          error: 'This email is already registered. Please login instead.'
        }, { status: 409 });
      }
      if (dbError.constraint?.includes('phone') || dbError.detail?.includes('phone')) {
        return NextResponse.json({
          success: false,
          error: 'This phone number is already registered. Please use a different number.'
        }, { status: 409 });
      }
      return NextResponse.json({
        success: false,
        error: 'A record with this information already exists.'
      }, { status: 409 });
    }

    // Handle connection errors
    if (dbError.message?.includes('connect') || dbError.message?.includes('timeout')) {
      return NextResponse.json({
        success: false,
        error: 'Unable to complete registration due to connection issues. Please try again.'
      }, { status: 503 });
    }

    // Handle constraint violations
    if (dbError.code === '23503') { // Foreign key violation
      console.error('Foreign key violation:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Invalid data relationship. Please try again or contact support.'
      }, { status: 400 });
    }
    
    // Handle check constraint violations
    if (dbError.code === '23514') { // Check constraint violation
      console.error('Check constraint violation:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Data validation failed on the server. Please check your inputs and try again.',
        detail: dbError.detail
      }, { status: 400 });
    }

    // Generic error response with more details in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Registration failed: ${dbError.message}` 
      : 'Registration failed. Please try again or contact support if the problem persists.';
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? dbError : undefined
    }, { status: 500 });
  }
}