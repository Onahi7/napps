import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { isAdmin } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function PUT(request: NextRequest) {
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

    const { userId, role } = await request.json()

    // Validate input
    if (!userId || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Update user role in transaction
    await prisma.$transaction(async (tx) => {
      // Remove existing role records
      await tx.participant.deleteMany({
        where: { userId }
      })
      await tx.validator.deleteMany({
        where: { userId }
      })
      await tx.admin.deleteMany({
        where: { userId }
      })

      // Create new role record based on role
      switch (role) {
        case 'PARTICIPANT':
          await tx.participant.create({
            data: {
              userId,
              state: '',
              lga: '',
              paymentStatus: 'PENDING',
              accreditationStatus: 'PENDING'
            }
          })
          break
        case 'VALIDATOR':
          await tx.validator.create({
            data: { userId }
          })
          break
        case 'ADMIN':
          await tx.admin.create({
            data: { userId }
          })
          break
      }

      // Update user role
      await tx.user.update({
        where: { id: userId },
        data: { role }
      })
    })

    // Revalidate relevant paths
    revalidatePath('/admin/settings')
    revalidatePath('/admin/users')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating user role:', error)
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    )
  }
}