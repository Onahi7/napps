'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { revalidatePath } from 'next/cache'
import { PrismaClient } from '@prisma/client'
import { generateParticipantReference } from '@/lib/utils/reference-generator'

const prisma = new PrismaClient()

export async function accreditParticipant(participantId: string, data: {
  status: 'COMPLETED' | 'PENDING'
  notes?: string
}) {
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

    // Update accreditation status
    await prisma.participant.update({
      where: { id: participantId },
      data: {
        accreditationStatus: data.status,
        accreditationDate: data.status === 'COMPLETED' ? new Date() : null
      }
    })

    // If completing accreditation and no reference code exists, generate one
    if (data.status === 'COMPLETED' && !participant.referenceCode) {
      const referenceCode = await generateParticipantReference()
      await prisma.participant.update({
        where: { id: participantId },
        data: { referenceCode }
      })
    }

    revalidatePath('/admin/accreditation')
    revalidatePath('/participant/profile')
    return { success: true }
  } catch (error) {
    console.error('Error updating accreditation:', error)
    throw error
  }
}

export async function getAccreditationStats() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const admin = await prisma.admin.findFirst({
      where: { userId: session.user.id }
    })
    if (!admin) throw new Error('Not an admin')

    const [
      totalParticipants,
      pendingAccreditations,
      completedAccreditations,
      byState,
      recentAccreditations
    ] = await Promise.all([
      // Total participants
      prisma.participant.count({
        where: { paymentStatus: 'COMPLETED' }
      }),
      // Pending accreditations
      prisma.participant.count({
        where: {
          paymentStatus: 'COMPLETED',
          accreditationStatus: 'PENDING'
        }
      }),
      // Completed accreditations
      prisma.participant.count({
        where: { accreditationStatus: 'COMPLETED' }
      }),
      // Accreditation by state
      prisma.participant.groupBy({
        by: ['state'],
        where: { accreditationStatus: 'COMPLETED' },
        _count: true
      }),
      // Recent accreditations
      prisma.participant.findMany({
        where: { 
          accreditationStatus: 'COMPLETED',
          accreditationDate: { not: null }
        },
        include: {
          user: true
        },
        orderBy: { accreditationDate: 'desc' },
        take: 10
      })
    ])

    return {
      total_participants: totalParticipants,
      pending_accreditations: pendingAccreditations,
      completed_accreditations: completedAccreditations,
      completion_rate: Math.round((completedAccreditations / totalParticipants) * 100) || 0,
      by_state: byState.map(s => ({
        state: s.state,
        count: s._count
      })),
      recent: recentAccreditations.map(p => ({
        name: p.user.fullName,
        email: p.user.email,
        state: p.state,
        chapter: p.chapter,
        date: p.accreditationDate?.toLocaleDateString()
      }))
    }
  } catch (error) {
    console.error('Error getting accreditation stats:', error)
    throw error
  }
}

export type AccreditationStatus = {
  status: 'not_registered' | 'pending_payment' | 'pending_accreditation' | 'accredited'
  reference_code?: string
  accreditation_date?: string
  accreditation_time?: string
  badge_collected?: boolean
  badge_collection_time?: string
  materials_collected?: boolean
  materials_collection_time?: string
  validator?: string
  location?: string
}

export async function getAccreditationStatus(): Promise<AccreditationStatus> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const participant = await prisma.participant.findFirst({
      where: { userId: session.user.id }
    })
    
    if (!participant) {
      return { status: 'not_registered' }
    }

    // If payment is not completed, return pending_payment status
    if (participant.paymentStatus !== 'COMPLETED') {
      return { status: 'pending_payment' }
    }

    // If accredited, include all accreditation details
    if (participant.accreditationStatus === 'COMPLETED') {
      const accDate = participant.accreditationDate
      return {
        status: 'accredited',
        reference_code: participant.referenceCode || undefined,
        accreditation_date: accDate?.toLocaleDateString(),
        accreditation_time: accDate?.toLocaleTimeString(),
        badge_collected: false, // These will need to be added to the Participant model if needed
        materials_collected: false, // These will need to be added to the Participant model if needed
      }
    }

    // Otherwise return pending status
    return {
      status: 'pending_accreditation',
      badge_collected: false,
      materials_collected: false
    }
  } catch (error) {
    console.error('Error getting accreditation status:', error)
    throw error
  }
}