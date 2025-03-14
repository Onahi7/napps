import { NextResponse } from 'next/server'
import { createUser } from '@/lib/auth'
import * as z from 'zod'

const registrationSchema = z.object({
  email: z.string()
    .email("Please enter a valid email address"),
  password: z.string(),
  full_name: z.string()
    .min(1, "Full name is required"),
  phone: z.string()
    .min(1, "Phone number is required"),
  school_name: z.string()
    .min(1, "School name is required"),
  school_address: z.string(),
  school_state: z.string()
    .min(1, "School state is required"),
  napps_chapter: z.string()
    .min(1, "NAPPS chapter is required")
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = registrationSchema.parse(body)
    await createUser(validatedData)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Registration error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid input data', 
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }
    
    if (error.message.includes('duplicate key')) {
      if (error.message.includes('email')) {
        return NextResponse.json(
          { error: 'This email is already registered' },
          { status: 400 }
        )
      }
      if (error.message.includes('phone')) {
        return NextResponse.json(
          { error: 'This phone number is already registered' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}