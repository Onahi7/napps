'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { revalidatePath } from 'next/cache'
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

export async function getParticipantStatus() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const participant = await prisma.participant.findFirst({
      where: { userId: session.user.id },
      include: {
        user: true,
        scans: {
          where: {
            scannedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }
      }
    })

    if (!participant) throw new Error('Not a participant')

    return {
      paymentStatus: participant.paymentStatus,
      accreditationStatus: participant.accreditationStatus,
      referenceCode: participant.referenceCode,
      todayScans: participant.scans.length,
      fullName: participant.user.fullName,
      email: participant.user.email,
      phone: participant.user.phone
    }
  } catch (error) {
    console.error('Error getting participant status:', error)
    throw error
  }
}

export async function updateProfile(data: {
  fullName?: string
  email?: string
  phone?: string
  state?: string
  lga?: string
  chapter?: string
  organization?: string
  position?: string
  dietaryRequirements?: string
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const participant = await prisma.participant.findFirst({
      where: { userId: session.user.id }
    })
    if (!participant) throw new Error('Not a participant')

    await Promise.all([
      // Update user data
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone
        }
      }),
      // Update participant data
      prisma.participant.update({
        where: { id: participant.id },
        data: {
          state: data.state,
          lga: data.lga,
          chapter: data.chapter,
          organization: data.organization,
          position: data.position,
        }
      })
    ])

    revalidatePath('/participant/profile')
    return { success: true }
  } catch (error) {
    console.error('Error updating profile:', error)
    throw error
  }
}