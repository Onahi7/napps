import { NextRequest, NextResponse } from 'next/server'
import { withTransaction } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { isAdmin } from '@/lib/auth'
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

    const { reference } = await request.json()
    
    if (!reference) {
      return NextResponse.json(
        { error: 'Payment reference is required' },
        { status: 400 }
      )
    }

    return await withTransaction(async (client) => {
      // Update payment status to completed
      const result = await client.query(
        `UPDATE profiles 
         SET payment_status = 'completed',
             payment_date = NOW(),
             updated_at = NOW()
         WHERE payment_reference = $1
         RETURNING id`,
        [reference]
      )

      if (result.rowCount === 0) {
        return NextResponse.json(
          { error: 'Payment not found' },
          { status: 404 }
        )
      }

      revalidatePath('/admin/payments')
      revalidatePath('/participant/dashboard')
      return NextResponse.json({ success: true })
    })
  } catch (error: any) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}