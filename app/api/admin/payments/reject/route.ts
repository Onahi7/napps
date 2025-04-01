import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { isAdmin } from '@/lib/auth'
import { query, withTransaction } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { CloudinaryService } from '@/lib/cloudinary-service'

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
        'SELECT payment_proof FROM profiles WHERE phone = $1',
        [phone]
      )

      if (result.rows[0]?.payment_proof) {
        try {
          const proofUrl = result.rows[0].payment_proof;
          const cloudinary = CloudinaryService.getInstance();
          const publicId = cloudinary.getPublicIdFromUrl(proofUrl);
          
          if (publicId) {
            console.log('[RejectAPI] Deleting file from Cloudinary:', publicId);
            await cloudinary.deleteFile(publicId);
          }
        } catch (error) {
          console.error('[RejectAPI] Failed to delete payment proof file:', error)
          // Continue anyway as we want to update the payment status
        }
      }

      // Reset payment status and proof
      await client.query(
        `UPDATE profiles 
         SET payment_status = 'pending',
             payment_proof = NULL,
             updated_at = NOW()
         WHERE phone = $1`,
        [phone]
      )

      revalidatePath('/admin/payments')
      revalidatePath('/participant/dashboard')

      return NextResponse.json({ success: true })
    })
  } catch (error: any) {
    console.error('[RejectAPI] Payment rejection error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to reject payment' },
      { status: 500 }
    )
  }
}