import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { isAdmin } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { CloudinaryService } from '@/lib/cloudinary-service'

const prisma = new PrismaClient()

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

    // Find the user and their participant record
    const user = await prisma.user.findUnique({
      where: { phone },
      include: { participant: true }
    })

    if (!user || !user.participant) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Handle payment proof deletion if exists
    if (user.participant.paymentProof) {
      try {
        const proofUrl = user.participant.paymentProof;
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
    await prisma.participant.update({
      where: { id: user.participant.id },
      data: {
        paymentStatus: 'PENDING',
        paymentProof: null
      }
    })

    revalidatePath('/admin/payments')
    revalidatePath('/participant/dashboard')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[RejectAPI] Payment rejection error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to reject payment' },
      { status: 500 }
    )
  }
}