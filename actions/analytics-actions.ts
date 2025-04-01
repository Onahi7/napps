'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function getRegistrationStats() {
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
      pendingPayments,
      proofSubmitted,
      byState,
      byChapter
    ] = await Promise.all([
      // Total registrations
      prisma.participant.count(),
      // Completed payments
      prisma.participant.count({
        where: { paymentStatus: 'COMPLETED' }
      }),
      // Pending payments
      prisma.participant.count({
        where: { paymentStatus: 'PENDING' }
      }),
      // Proof submitted
      prisma.participant.count({
        where: { paymentStatus: 'PROOF_SUBMITTED' }
      }),
      // Registration by state
      prisma.participant.groupBy({
        by: ['state'],
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        }
      }),
      // Registration by chapter
      prisma.participant.groupBy({
        by: ['chapter'],
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        }
      })
    ])

    return {
      total: totalRegistrations,
      payment: {
        completed: completedPayments,
        pending: pendingPayments,
        proof_submitted: proofSubmitted
      },
      by_state: byState.map(s => ({
        state: s.state,
        count: s._count.id
      })),
      by_chapter: byChapter.map(c => ({
        chapter: c.chapter || 'Unspecified',
        count: c._count.id
      })),
      completion_rate: Math.round((completedPayments / totalRegistrations) * 100) || 0
    }
  } catch (error) {
    console.error('Error getting registration stats:', error)
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
      accredited,
      pending,
      recentScans,
      validatorStats
    ] = await Promise.all([
      // Total eligible participants
      prisma.participant.count({
        where: { paymentStatus: 'COMPLETED' }
      }),
      // Accredited participants
      prisma.participant.count({
        where: { accreditationStatus: 'COMPLETED' }
      }),
      // Pending accreditation
      prisma.participant.count({
        where: {
          paymentStatus: 'COMPLETED',
          accreditationStatus: 'PENDING'
        }
      }),
      // Recent scans
      prisma.scan.findMany({
        where: { type: 'CHECK_IN' },
        include: {
          participant: {
            include: {
              user: true
            }
          },
          validator: {
            include: {
              user: true
            }
          }
        },
        orderBy: { scannedAt: 'desc' },
        take: 10
      }),
      // Validator performance
      prisma.scan.groupBy({
        by: ['validatorId'],
        where: { type: 'CHECK_IN' },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        }
      })
    ])

    // Get validator details
    const validatorDetails = await prisma.validator.findMany({
      where: {
        id: {
          in: validatorStats.map(v => v.validatorId)
        }
      },
      include: {
        user: true
      }
    })

    return {
      total: totalParticipants,
      accredited,
      pending,
      completion_rate: Math.round((accredited / totalParticipants) * 100) || 0,
      recent: recentScans.map(scan => ({
        participant: scan.participant.user.fullName,
        validator: scan.validator.user.fullName,
        time: scan.scannedAt.toLocaleString(),
        location: scan.location
      })),
      by_validator: validatorStats.map(stat => {
        const validator = validatorDetails.find(v => v.id === stat.validatorId)
        return {
          name: validator?.user.fullName || 'Unknown',
          count: stat._count.id
        }
      })
    }
  } catch (error) {
    console.error('Error getting accreditation stats:', error)
    throw error
  }
}

export async function getResourceStats() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const admin = await prisma.admin.findFirst({
      where: { userId: session.user.id }
    })
    if (!admin) throw new Error('Not an admin')

    const [
      totalResources,
      totalAccesses,
      resourceUsage
    ] = await Promise.all([
      // Total resources
      prisma.resource.count(),
      // Total resource accesses
      prisma.resourceAccess.count(),
      // Resource usage stats
      prisma.resourceAccess.groupBy({
        by: ['resourceId', 'accessType'],
        _count: true
      })
    ])

    // Get resource details
    const resources = await prisma.resource.findMany({
      where: {
        id: {
          in: [...new Set(resourceUsage.map(r => r.resourceId))]
        }
      }
    })

    // Group usage by resource
    const byResource = resources.map(resource => {
      const views = resourceUsage.find(
        r => r.resourceId === resource.id && r.accessType === 'VIEW'
      )?._count || 0
      const downloads = resourceUsage.find(
        r => r.resourceId === resource.id && r.accessType === 'DOWNLOAD'
      )?._count || 0

      return {
        title: resource.title,
        type: resource.type,
        views,
        downloads
      }
    })

    return {
      total_resources: totalResources,
      total_accesses: totalAccesses,
      by_resource: byResource
    }
  } catch (error) {
    console.error('Error getting resource stats:', error)
    throw error
  }
}