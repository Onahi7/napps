'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { revalidatePath } from 'next/cache'
import { PrismaClient, AccessType } from '@prisma/client'

const prisma = new PrismaClient()

export async function trackResourceAccess(resourceId: string, accessType: 'view' | 'download') {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const participant = await prisma.participant.findFirst({
      where: { userId: session.user.id }
    })
    if (!participant) throw new Error('Not a participant')

    // Record the access
    await prisma.resourceAccess.create({
      data: {
        participantId: participant.id,
        resourceId,
        accessType: accessType.toUpperCase() as AccessType,
        accessedAt: new Date()
      }
    })

    return { success: true }
  } catch (error: any) {
    if (error?.code === 'P2002') {
      // Unique constraint violation - access already recorded
      return { success: true }
    }
    console.error('Error tracking resource access:', error)
    throw error
  }
}