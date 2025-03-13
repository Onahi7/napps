import { NextResponse } from 'next/server'
import { createUser } from '@/lib/auth'
import * as z from 'zod'  // Change the import to use namespace import

// Validation schema
const registrationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(2),
  phone: z.string().min(10),
  state: z.string().optional(),
  lga: z.string().optional(),
  chapter: z.string().optional(),
  organization: z.string().optional(),
  position: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validatedData = registrationSchema.parse(body)
    
    // Create user and profile
    await createUser(validatedData)
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Registration error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    )
  }
}