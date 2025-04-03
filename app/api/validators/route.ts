import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { PrismaClient } from '@prisma/client'
import { createValidator } from '@/actions/user-actions'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const validators = await prisma.validator.findMany({
      include: {
        user: true,
        scans: true
      }
    })

    const formattedValidators = validators.map(validator => ({
      id: validator.id,
      name: validator.user.fullName,
      email: validator.user.email,
      phone: validator.user.phone,
      role: validator.user.role,
      status: validator.user.role === 'VALIDATOR' ? 'Active' : 'Inactive',
      validations: validator.scans.length
    }))

    return NextResponse.json({
      success: true,
      validators: formattedValidators
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { email, password, full_name, phone } = body

    if (!email || !password || !full_name || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const validatorId = await createValidator({
      email,
      password,
      full_name,
      phone
    })

    return NextResponse.json({ success: true, validatorId })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}