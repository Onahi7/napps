import { NextRequest, NextResponse } from 'next/server'
import { withTransaction } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { isAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import fs from 'fs/promises'
import path from 'path'

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
      // Get the current payment proof file path
      const result = await client.query(
        'SELECT payment_proof FROM profiles WHERE payment_reference = $1',
        [reference]
      )

      if (result.rows[0]?.payment_proof) {
        const proofPath = result.rows[0].payment_proof
        // Remove the file if it exists
        try {
          const fullPath = path.join(process.cwd(), 'public', proofPath)
          await fs.unlink(fullPath)
        } catch (error) {
          console.error('Error deleting payment proof file:', error)
          // Continue even if file deletion fails
        }
      }

      // Reset payment status to pending and clear proof
      await client.query(
        `UPDATE profiles 
         SET payment_status = 'pending',
             payment_proof = NULL,
             updated_at = NOW()
         WHERE payment_reference = $1`,
        [reference]
      )

      revalidatePath('/admin/payments')
      return NextResponse.json({ success: true })
    })
  } catch (error: any) {
    console.error('Error rejecting payment:', error)
    return NextResponse.json(
      { error: 'Failed to reject payment' },
      { status: 500 }
    )
  }
}