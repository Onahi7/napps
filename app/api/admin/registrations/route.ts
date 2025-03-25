import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { isAdmin } from '@/lib/auth'
import { query } from '@/lib/db'

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

    // Fetch all registrations - updated query to use LEFT JOIN
    const result = await query(
      `SELECT 
        p.id,
        p.full_name,
        p.email,
        p.phone,
        p.school_name,
        p.school_state,
        p.napps_chapter,
        p.payment_status,
        p.accreditation_status,
        p.created_at
       FROM profiles p
       ORDER BY p.created_at DESC`,
      []
    )

    return NextResponse.json(result.rows)
  } catch (error: any) {
    console.error('Error fetching registrations:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch registrations' },
      { status: 500 }
    )
  }
}