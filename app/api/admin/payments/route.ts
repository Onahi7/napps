import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { isAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify admin access
    const admin = await isAdmin(session.user.id)
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    // Fetch pending payments (those with proof submitted but not yet verified)
    const result = await query(
      `SELECT 
        p.id,
        u.full_name,
        u.email,
        u.phone,
        p.payment_reference,
        p.payment_proof,
        p.payment_amount,
        p.payment_status
       FROM profiles p
       JOIN users u ON p.id = u.id
       WHERE p.payment_status = 'proof_submitted'
       ORDER BY p.updated_at DESC`,
      []
    )

    return NextResponse.json(result.rows)
  } catch (error: any) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}