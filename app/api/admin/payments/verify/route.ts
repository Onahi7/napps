import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { isAdmin } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

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

    // Find the user by phone number first
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

    // Only allow verifying payments that have proof submitted
    if (user.participant.paymentStatus !== 'PROOF_SUBMITTED') {
      return NextResponse.json(
        { error: 'Payment proof has not been submitted' },
        { status: 400 }
      )
    }

    // Update payment status to completed
    await prisma.participant.update({
      where: { id: user.participant.id },
      data: {
        paymentStatus: 'COMPLETED'
      }
    })

    revalidatePath('/admin/payments')
    revalidatePath('/participant/dashboard')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 500 }
    )
  }
}