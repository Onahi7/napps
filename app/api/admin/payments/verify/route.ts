import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { isAdmin } from '@/lib/auth'
import { query, withTransaction } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
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

    const { phone } = await request.json()
    
    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    return await withTransaction(async (client) => {
      // Get the user profile 
      const result = await client.query(
        'SELECT p.* FROM profiles p JOIN users u ON p.id = u.id WHERE u.phone = $1',
        [phone]
      )

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Payment not found' },
          { status: 404 }
        )
      }

      // Update payment status
      await client.query(
        `UPDATE profiles p
         SET payment_status = 'completed',
             updated_at = NOW()
         FROM users u
         WHERE p.id = u.id AND u.phone = $1`,
        [phone]
      )

      revalidatePath('/admin/payments')
      revalidatePath('/participant/dashboard')

      return NextResponse.json({ success: true })
    })
  } catch (error: any) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 500 }
    )
  }
}