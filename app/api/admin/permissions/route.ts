import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { isAdmin } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
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

    // Get distinct access types from ResourceAccess
    const accessTypes = await prisma.resourceAccess.findMany({
      distinct: ['accessType'],
      select: {
        accessType: true
      }
    })

    // Transform to match expected format
    const permissions = accessTypes.map(access => ({
      id: access.accessType,
      name: access.accessType,
      description: access.accessType === 'VIEW' 
        ? 'Permission to view resources' 
        : access.accessType === 'DOWNLOAD' 
        ? 'Permission to download resources'
        : 'Unknown permission type'
    }))

    return NextResponse.json(permissions)
  } catch (error: any) {
    console.error('Error fetching permissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    )
  }
}

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

    const { participantId, resourceId, accessType } = await request.json()

    // Validate input
    if (!participantId || !resourceId || !accessType) {
      return NextResponse.json(
        { error: 'Participant ID, Resource ID and Access Type are required' },
        { status: 400 }
      )
    }

    // Create new resource access
    const resourceAccess = await prisma.resourceAccess.create({
      data: {
        participantId,
        resourceId,
        accessType
      }
    })

    return NextResponse.json({ id: resourceAccess.id })
  } catch (error: any) {
    console.error('Error creating permission:', error)
    return NextResponse.json(
      { error: 'Failed to create permission' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    const { permissionId } = await request.json()

    // Validate input
    if (!permissionId) {
      return NextResponse.json(
        { error: 'Permission ID is required' },
        { status: 400 }
      )
    }

    // Delete the resource access
    await prisma.resourceAccess.delete({
      where: { id: permissionId }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting permission:', error)
    return NextResponse.json(
      { error: 'Failed to delete permission' },
      { status: 500 }
    )
  }
}