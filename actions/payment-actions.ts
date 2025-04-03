'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { revalidatePath } from 'next/cache'
import { PrismaClient, PaymentStatus } from '@prisma/client'
import { uploadToCloudinary } from '@/lib/cloudinary-service'
import { getConfig } from './config-actions'
import { generateParticipantReference } from '@/lib/utils/reference-generator'
import { query } from '@/lib/db'

const prisma = new PrismaClient()

export async function uploadPaymentProof(data: {
  amount: number
  transactionReference: string
  file: File
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const participant = await prisma.participant.findFirst({
      where: { userId: session.user.id }
    })
    if (!participant) throw new Error('Not a participant')

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(data.file.type)) {
      throw new Error('Invalid file type. Please upload an image (JPG/PNG) or PDF')
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (data.file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 5MB')
    }

    try {
      // Upload proof to Cloudinary
      const buffer = await data.file.arrayBuffer()
      const uploadResult = await uploadToCloudinary(Buffer.from(buffer), {
        folder: 'payment-proofs',
        allowedFormats: ['jpg', 'jpeg', 'png', 'pdf']
      })

      if (!uploadResult?.secure_url) {
        throw new Error('Failed to get upload URL from Cloudinary')
      }

      // Update participant with payment info
      await prisma.participant.update({
        where: { id: participant.id },
        data: {
          paymentAmount: data.amount,
          paymentProof: uploadResult.secure_url,
          paymentStatus: 'PROOF_SUBMITTED',
          paymentDate: new Date()
        }
      })

      revalidatePath('/participant/payment')
      revalidatePath('/admin/payments')
      return participant.id
    } catch (uploadError) {
      console.error('Error uploading to Cloudinary:', uploadError)
      throw new Error('Failed to upload payment proof. Please check your internet connection and try again.')
    }
  } catch (error) {
    console.error('Error in uploadPaymentProof:', error)
    throw error instanceof Error ? error : new Error('Failed to process payment proof')
  }
}

export async function verifyPayment(participantId: string, status: PaymentStatus) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const admin = await prisma.admin.findFirst({
      where: { userId: session.user.id }
    })
    if (!admin) throw new Error('Not an admin')

    const participant = await prisma.participant.findUnique({
      where: { id: participantId }
    })
    if (!participant) throw new Error('Participant not found')

    // Update payment status
    await prisma.participant.update({
      where: { id: participantId },
      data: { paymentStatus: status }
    })

    // If payment is completed, generate reference code if not exists
    if (status === 'COMPLETED' && !participant.referenceCode) {
      const referenceCode = await generateParticipantReference()
      await prisma.participant.update({
        where: { id: participantId },
        data: { referenceCode }
      })
    }

    revalidatePath('/participant/payment')
    revalidatePath('/admin/payments')
    return { success: true }
  } catch (error) {
    console.error('Error verifying payment:', error)
    throw error
  }
}

export async function getPendingPayments() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const admin = await prisma.admin.findFirst({
      where: { userId: session.user.id }
    })
    if (!admin) throw new Error('Not an admin')

    const payments = await prisma.participant.findMany({
      where: {
        paymentStatus: 'PROOF_SUBMITTED'
      },
      include: {
        user: true
      },
      orderBy: {
        paymentDate: 'desc'
      }
    })

    return payments.map(p => ({
      id: p.id,
      fullName: p.user.fullName,
      email: p.user.email,
      phone: p.user.phone,
      state: p.state,
      chapter: p.chapter,
      amount: p.paymentAmount,
      proofUrl: p.paymentProof,
      date: p.paymentDate?.toLocaleDateString()
    }))
  } catch (error) {
    console.error('Error getting pending payments:', error)
    throw error
  }
}

export async function getPaymentStats() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const admin = await prisma.admin.findFirst({
      where: { userId: session.user.id }
    })
    if (!admin) throw new Error('Not an admin')

    const [
      totalRegistrations,
      completedPayments,
      pendingProofs,
      totalAmount,
      recentPayments
    ] = await Promise.all([
      // Total registrations
      prisma.participant.count(),
      // Completed payments
      prisma.participant.count({
        where: { paymentStatus: 'COMPLETED' }
      }),
      // Pending proofs
      prisma.participant.count({
        where: { paymentStatus: 'PROOF_SUBMITTED' }
      }),
      // Total amount collected
      prisma.participant.aggregate({
        where: { paymentStatus: 'COMPLETED' },
        _sum: {
          paymentAmount: true
        }
      }),
      // Recent payments
      prisma.participant.findMany({
        where: {
          paymentStatus: 'COMPLETED',
          paymentDate: { not: null }
        },
        include: {
          user: true
        },
        orderBy: {
          paymentDate: 'desc'
        },
        take: 10
      })
    ])

    // Payment by state stats
    const byState = await prisma.participant.groupBy({
      by: ['state'],
      where: { paymentStatus: 'COMPLETED' },
      _count: true,
      _sum: {
        paymentAmount: true
      }
    })

    return {
      total_registrations: totalRegistrations,
      completed_payments: completedPayments,
      pending_proofs: pendingProofs,
      total_amount: totalAmount._sum.paymentAmount || 0,
      completion_rate: Math.round((completedPayments / totalRegistrations) * 100) || 0,
      by_state: byState.map(s => ({
        state: s.state,
        count: s._count,
        amount: s._sum.paymentAmount || 0
      })),
      recent: recentPayments.map(p => ({
        name: p.user.fullName,
        email: p.user.email,
        amount: p.paymentAmount,
        date: p.paymentDate?.toLocaleDateString()
      }))
    }
  } catch (error) {
    console.error('Error getting payment stats:', error)
    throw error
  }
}

export async function getParticipantPayment(participantId?: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    // If participantId is provided, verify admin access
    if (participantId) {
      const admin = await prisma.admin.findFirst({
        where: { userId: session.user.id }
      })
      if (!admin) throw new Error('Unauthorized')
    }

    // Get participant
    const participant = await prisma.participant.findFirst({
      where: {
        ...(participantId ? { id: participantId } : { userId: session.user.id })
      },
      include: {
        user: true
      }
    })
    if (!participant) throw new Error('Participant not found')

    // Get conference fee from config
    const registrationFee = await getConfig('conference.registrationFee') || 20000

    return {
      status: participant.paymentStatus,
      amount: participant.paymentAmount || registrationFee,
      proofUrl: participant.paymentProof,
      date: participant.paymentDate?.toLocaleDateString(),
      referenceCode: participant.referenceCode,
      fullName: participant.user.fullName,
      email: participant.user.email,
      phone: participant.user.phone
    }
  } catch (error) {
    console.error('Error getting participant payment:', error)
    throw error
  }
}

export async function getPaymentsByState(state: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const admin = await prisma.admin.findFirst({
      where: { userId: session.user.id }
    })
    if (!admin) throw new Error('Not an admin')

    const payments = await prisma.participant.findMany({
      where: {
        state,
        paymentStatus: 'COMPLETED'
      },
      include: {
        user: true
      },
      orderBy: {
        paymentDate: 'desc'
      }
    })

    return payments.map(p => ({
      id: p.id,
      fullName: p.user.fullName,
      email: p.user.email,
      chapter: p.chapter,
      amount: p.paymentAmount,
      date: p.paymentDate?.toLocaleDateString(),
      referenceCode: p.referenceCode
    }))
  } catch (error) {
    console.error('Error getting payments by state:', error)
    throw error
  }
}

export interface PaymentVerificationResult {
  verified: boolean
  error?: string
  status?: string
}

export async function verifyRegistrationPayment(): Promise<PaymentVerificationResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const participant = await prisma.participant.findFirst({
      where: { userId: session.user.id }
    })
    if (!participant) throw new Error('Participant not found')

    // In a real implementation, verify the payment with the payment gateway
    // For now, just check if payment status is already completed
    if (participant.paymentStatus === 'COMPLETED') {
      return {
        verified: true,
        status: 'COMPLETED'
      }
    }

    // Update payment status to completed
    await prisma.participant.update({
      where: { id: participant.id },
      data: {
        paymentStatus: 'COMPLETED',
        paymentDate: new Date()
      }
    })

    // Generate reference code if not exists
    if (!participant.referenceCode) {
      const referenceCode = await generateParticipantReference()
      await prisma.participant.update({
        where: { id: participant.id },
        data: { referenceCode }
      })
    }

    revalidatePath('/participant/payment')
    revalidatePath('/admin/payments')
    return {
      verified: true,
      status: 'COMPLETED'
    }
  } catch (error) {
    console.error('Error verifying registration payment:', error)
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'Payment verification failed'
    }
  }
}

export async function verifyHotelBookingPayment(): Promise<PaymentVerificationResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const booking = await query(
      `SELECT id, status, payment_status 
       FROM bookings 
       WHERE user_id = $1 
       AND status = 'pending' 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [session.user.id]
    )

    if (!booking.rows[0]) throw new Error('No pending hotel booking found')

    // In a real implementation, verify the payment with payment gateway
    // For now, just update status to confirmed
    await query(
      `UPDATE bookings 
       SET status = 'confirmed',
           payment_status = 'completed',
           payment_date = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [booking.rows[0].id]
    )

    revalidatePath('/participant/accommodation')
    revalidatePath('/admin/hotels')
    return {
      verified: true,
      status: 'confirmed'  
    }
  } catch (error) {
    console.error('Error verifying hotel booking payment:', error)
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'Payment verification failed'
    }
  }
}

