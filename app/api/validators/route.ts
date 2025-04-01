import { NextResponse } from 'next/server'
import { createValidator } from '@/actions/user-actions'
import { query } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const result = await query(
      `SELECT p.id, p.full_name as name, p.email, p.phone, p.role,
              CASE WHEN p.role = 'validator' THEN 'Active' ELSE 'Inactive' END as status,
              COALESCE((SELECT COUNT(*) FROM scans WHERE scanned_by = p.id), 0) as validations
       FROM profiles p
       WHERE p.role = 'validator'
       ORDER BY p.created_at DESC`
    )

    return NextResponse.json({
      success: true,
      validators: result.rows
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