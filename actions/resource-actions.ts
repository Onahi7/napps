'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { revalidatePath } from 'next/cache'
import { PrismaClient, AccessType } from '@prisma/client'
import { uploadToCloudinary, CloudinaryService } from '@/lib/cloudinary-service'

const prisma = new PrismaClient()

export async function createResource(data: {
  title: string
  type: 'DOCUMENT' | 'VIDEO' | 'PRESENTATION' | 'OTHER'
  file: File
  description?: string
  isPublic?: boolean
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const admin = await prisma.admin.findFirst({
      where: { userId: session.user.id }
    })
    if (!admin) throw new Error('Not an admin')

    // Upload file to Cloudinary
    const buffer = await data.file.arrayBuffer()
    const uploadResult = await uploadToCloudinary(Buffer.from(buffer))

    // Create resource
    const resource = await prisma.resource.create({
      data: {
        title: data.title,
        type: data.type,
        url: uploadResult.secure_url,
        description: data.description,
        isPublic: data.isPublic ?? false
      }
    })

    revalidatePath('/admin/resources')
    revalidatePath('/participant/resources')
    return resource.id
  } catch (error) {
    console.error('Error creating resource:', error)
    throw error
  }
}

export async function updateResource(id: string, data: {
  title?: string
  description?: string
  isPublic?: boolean
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const admin = await prisma.admin.findFirst({
      where: { userId: session.user.id }
    })
    if (!admin) throw new Error('Not an admin')

    await prisma.resource.update({
      where: { id },
      data: {
        ...data
      }
    })

    revalidatePath('/admin/resources')
    revalidatePath('/participant/resources')
    return { success: true }
  } catch (error) {
    console.error('Error updating resource:', error)
    throw error
  }
}

export async function deleteResource(id: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const admin = await prisma.admin.findFirst({
      where: { userId: session.user.id }
    })
    if (!admin) throw new Error('Not an admin')

    // Get resource URL before deletion
    const resource = await prisma.resource.findUnique({
      where: { id }
    })
    if (!resource) throw new Error('Resource not found')

    // Delete from Cloudinary first
    const cloudinary = CloudinaryService.getInstance()
    const publicId = cloudinary.getPublicIdFromUrl(resource.url)
    if (publicId) {
      await cloudinary.deleteFile(publicId)
    }

    // Then delete from database
    await prisma.resource.delete({
      where: { id }
    })

    revalidatePath('/admin/resources')
    revalidatePath('/participant/resources')
    return { success: true }
  } catch (error) {
    console.error('Error deleting resource:', error)
    throw error
  }
}

export async function getResourceById(id: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const resource = await prisma.resource.findUnique({
      where: { id },
      include: {
        accesses: {
          where: {
            participant: {
              userId: session.user.id
            }
          }
        }
      }
    })

    if (!resource) throw new Error('Resource not found')

    // Check if user has access
    const participant = await prisma.participant.findFirst({
      where: { userId: session.user.id }
    })

    if (!resource.isPublic && (!participant || !resource.accesses.length)) {
      throw new Error('Access denied')
    }

    return {
      ...resource,
      hasAccess: resource.isPublic || resource.accesses.length > 0
    }
  } catch (error) {
    console.error('Error getting resource:', error)
    throw error
  }
}

export async function getResources(isAdmin?: boolean) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    // If admin, verify admin status
    if (isAdmin) {
      const admin = await prisma.admin.findFirst({
        where: { userId: session.user.id }
      })
      if (!admin) throw new Error('Not an admin')

      // Return all resources for admin
      const resources = await prisma.resource.findMany({
        orderBy: { createdAt: 'desc' }
      })
      return resources.map(resource => ({
        id: resource.id,
        title: resource.title,
        description: resource.description || '',
        file_url: resource.url,
        file_type: resource.type.toLowerCase(),
        category: resource.type,
        is_public: resource.isPublic,
        created_at: resource.createdAt.toISOString()
      }))
    }

    // Non-admin case: return only public or accessible resources
    const participant = await prisma.participant.findFirst({
      where: { userId: session.user.id }
    })

    const resources = await prisma.resource.findMany({
      where: {
        OR: [
          { isPublic: true },
          {
            accesses: {
              some: {
                participantId: participant?.id
              }
            }
          }
        ]
      },
      include: {
        accesses: {
          where: {
            participantId: participant?.id
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return resources.map(resource => ({
      id: resource.id,
      title: resource.title,
      description: resource.description || '',
      file_url: resource.url,
      file_type: resource.type.toLowerCase(),
      category: resource.type,
      is_public: resource.isPublic,
      created_at: resource.createdAt.toISOString()
    }))
  } catch (error) {
    console.error('Error getting resources:', error)
    throw error
  }
}

export async function recordResourceAccess(resourceId: string, accessType: AccessType) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const participant = await prisma.participant.findFirst({
      where: { userId: session.user.id }
    })
    if (!participant) throw new Error('Participant not found')

    const resource = await prisma.resource.findUnique({
      where: { id: resourceId }
    })
    if (!resource) throw new Error('Resource not found')

    // Record access
    await prisma.resourceAccess.create({
      data: {
        participantId: participant.id,
        resourceId,
        accessType,
        accessedAt: new Date()
      }
    })

    return { success: true }
  } catch (error: any) {
    if (error?.code === 'P2002') {
      // Unique constraint violation - access already recorded
      return { success: true }
    }
    console.error('Error recording resource access:', error)
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
      publicResources,
      recentResources,
      categoryStats
    ] = await Promise.all([
      // Total resources
      prisma.resource.count(),
      // Public resources
      prisma.resource.count({
        where: { isPublic: true }
      }),
      // Recent resources (last 7 days)
      prisma.resource.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      // Resources by category
      prisma.resource.groupBy({
        by: ['type'],
        _count: true
      })
    ])

    return {
      total_resources: totalResources,
      public_resources: publicResources,
      recent_resources: recentResources,
      categories: categoryStats.map(cat => ({
        category: cat.type,
        count: cat._count
      }))
    }
  } catch (error) {
    console.error('Error getting resource stats:', error)
    throw error
  }
}

