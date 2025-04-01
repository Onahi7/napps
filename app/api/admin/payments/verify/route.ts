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
        'SELECT payment_status FROM profiles WHERE phone = $1',
        [phone]
      )

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Payment not found' },
          { status: 404 }
        )
      }

      // Only allow verifying payments that have proof submitted
      if (result.rows[0].payment_status !== 'proof_submitted') {
        return NextResponse.json(
          { error: 'Payment proof has not been submitted' },
          { status: 400 }
        )
      }

      // Update payment status to completed
      await client.query(
        `UPDATE profiles 
         SET payment_status = 'completed',
             updated_at = NOW()
         WHERE phone = $1`,
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