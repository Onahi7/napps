'use server'

import { getServerSession } from 'next-auth'
import { PrismaClient, ScanType } from '@prisma/client'
import { authOptions } from '@/lib/auth-options'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function validateParticipant(referenceCode: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const validator = await prisma.validator.findFirst({
      where: { userId: session.user.id }
    })
    if (!validator) throw new Error('Not a validator')

    const participant = await prisma.participant.findFirst({
      where: { referenceCode },
      include: {
        user: true,
        scans: {
          where: {
            scannedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)) // Today
            }
          }
        }
      }
    })

    if (!participant) {
      throw new Error('Invalid reference code')
    }

    if (participant.accreditationStatus !== 'COMPLETED') {
      throw new Error('Participant not accredited')
    }

    // Create scan record
    const scan = await prisma.scan.create({
      data: {
        participantId: participant.id,
        validatorId: validator.id,
        type: 'CHECK_IN',
        scannedAt: new Date()
      }
    })

    revalidatePath('/validator/dashboard')
    revalidatePath('/validator/history')
    revalidatePath('/admin/validators')

    return {
      success: true,
      participant: {
        fullName: participant.user.fullName,
        validationsToday: participant.scans.length + 1
      }
    }
  } catch (error) {
    console.error('Error validating participant:', error)
    throw error
  }
}

export async function createScan({ participantId, validatorId, type, location, notes }: { 
  participantId: string
  validatorId: string
  type: string
  location?: string
  notes?: string
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const scan = await prisma.scan.create({
      data: {
        participantId,
        validatorId,
        type: type as ScanType,
        location,
        notes,
        scannedAt: new Date()
      }
    })

    revalidatePath('/validator/dashboard')
    revalidatePath('/validator/history')
    revalidatePath('/admin/validators')

    return scan
  } catch (error) {
    console.error('Error creating scan:', error)
    throw error
  }
}

export async function getScanStats() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const validator = await prisma.validator.findFirst({
      where: { userId: session.user.id }
    })
    if (!validator) throw new Error('Not a validator')

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [totalToday, recentScans] = await Promise.all([
      // Total scans today
      prisma.scan.count({
        where: {
          validatorId: validator.id,
          scannedAt: {
            gte: today
          }
        }
      }),
      // Recent scans
      prisma.scan.findMany({
        where: {
          validatorId: validator.id,
          scannedAt: {
            gte: today
          }
        },
        include: {
          participant: {
            include: {
              user: true
            }
          }
        },
        orderBy: {
          scannedAt: 'desc'
        },
        take: 10
      })
    ])

    return {
      today_scans: totalToday,
      recent: recentScans.map((scan) => ({
        participant_name: scan.participant.user.fullName,
        time: scan.scannedAt.toLocaleTimeString(),
        type: scan.type
      }))
    }
  } catch (error) {
    console.error('Error getting validation stats:', error)
    throw error
  }
}

export async function getScanHistory() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const validator = await prisma.validator.findFirst({
      where: { userId: session.user.id }
    })
    if (!validator) throw new Error('Not a validator')

    const scans = await prisma.scan.findMany({
      where: {
        validatorId: validator.id
      },
      include: {
        participant: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        scannedAt: 'desc'
      },
      take: 100 // Limit to last 100 scans
    })

    return scans.map((scan) => ({
      id: scan.id,
      full_name: scan.participant.user.fullName,
      created_at: scan.scannedAt,
      type: scan.type,
      location: scan.location
    }))
  } catch (error) {
    console.error('Error getting scan history:', error)
    throw error
  }
}

