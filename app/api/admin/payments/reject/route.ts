import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { isAdmin } from '@/lib/auth'
import { query, withTransaction } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { StorageService } from '@/lib/storage'

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
      // Get the current payment proof file path
      const result = await client.query(
        'SELECT p.payment_proof FROM profiles p JOIN users u ON p.id = u.id WHERE u.phone = $1',
        [phone]
      )

      if (result.rows[0]?.payment_proof) {
        try {
          // Delete the file from storage
          const storage = StorageService.getInstance()
          await storage.deleteFile(result.rows[0].payment_proof)
        } catch (error) {
          console.error('Failed to delete payment proof file:', error)
          // Continue anyway as we want to update the payment status
        }
      }

      // Reset payment status and proof
      await client.query(
        `UPDATE profiles p
         SET payment_status = 'pending',
             payment_proof = NULL,
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
    console.error('Payment rejection error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to reject payment' },
      { status: 500 }
    )
  }
}