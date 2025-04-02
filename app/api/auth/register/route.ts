import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { verifyDatabaseConnection } from '@/lib/db-config'
import { generateParticipantReference } from '@/lib/utils/reference-generator'

const prisma = new PrismaClient()

// Registration schema matching Prisma schema
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
    // Verify database connection first
    try {
      await verifyDatabaseConnection();
    } catch (error) {
      console.error('Database verification failed:', error);
      let errorMessage = 'Database connection issue. Please try again in a few moments.';
      
      if (error instanceof Error) {
        if (error.message.includes('authentication failed')) {
          errorMessage = 'Database authentication error. Please contact support.';
        } else if (error.message.includes('timed out')) {
          errorMessage = 'Database connection timed out. Please try again later.';
        } else if (error.message.includes('host not found')) {
          errorMessage = 'Database server unavailable. Please try again later.';
        }
      }
      
      return NextResponse.json({
        success: false,
        error: errorMessage
      }, { status: 503 });
    }

    const body = await req.json();

    // Validate input first
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

    // Check for existing user
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { phone: data.phone }
        ]
      }
    });

    if (existingUser) {
      const errorField = existingUser.email === data.email ? 'email' : 'phone';
      return NextResponse.json({
        success: false,
        error: `This ${errorField} is already registered`
      }, { status: 409 });
    }

    // Create user and participant in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: passwordHash,
          fullName: data.full_name,
          phone: data.phone,
          role: 'PARTICIPANT'
        }
      });

      // Create participant profile
      const participant = await tx.participant.create({
        data: {
          userId: user.id,
          state: data.school_state,
          lga: data.school_address || '',
          chapter: data.napps_chapter,
          organization: data.school_name,
          paymentStatus: 'PENDING',
          accreditationStatus: 'PENDING',
          qrCode: referenceCode
        }
      });

      return { user, participant };
    });

    console.log('Registration successful');
    return NextResponse.json({ 
      success: true,
      message: 'Registration successful',
      referenceCode
    });

  } catch (error: unknown) {
    console.error('Registration error:', error);

    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        if (error.message.includes('email')) {
          return NextResponse.json({
            success: false,
            error: 'This email is already registered'
          }, { status: 409 });
        } else if (error.message.includes('phone')) {
          return NextResponse.json({
            success: false,
            error: 'This phone number is already registered'
          }, { status: 409 });
        }
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Registration failed. Please try again later.'
    }, { status: 500 });
  }
}