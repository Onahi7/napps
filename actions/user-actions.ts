'use server'

import { hash } from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { generateParticipantReference } from '@/lib/utils/reference-generator'
import { query } from '@/lib/db'

const prisma = new PrismaClient()

export async function registerUser(data: {
  fullName: string
  email: string
  phone: string
  state: string
  lga: string
  chapter?: string
  organization?: string
  position?: string
  dietaryRequirements?: string
}) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { phone: data.phone }
        ]
      }
    })

    if (existingUser) {
      throw new Error('User already exists')
    }

    // Create user and participant in transaction
    const { user, participant } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          role: 'PARTICIPANT',
          // For participants, we don't require a password initially
          password: await hash(Math.random().toString(36), 12)
        }
      })

      const participant = await tx.participant.create({
        data: {
          userId: user.id,
          state: data.state,
          lga: data.lga,
          chapter: data.chapter,
          organization: data.organization,
          position: data.position,
          paymentStatus: 'PENDING',
          accreditationStatus: 'PENDING'
        }
      })

      return { user, participant }
    })

    return {
      id: participant.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone
    }
  } catch (error) {
    console.error('Error registering user:', error)
    throw error
  }
}

export async function preRegisterUsers(data: {
  users: Array<{
    fullName: string
    email: string
    phone: string
    state: string
    lga: string
    chapter?: string
    organization?: string
    position?: string
  }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const admin = await prisma.admin.findFirst({
      where: { userId: session.user.id }
    })
    if (!admin) throw new Error('Unauthorized')

    const results = await Promise.all(
      data.users.map(async (userData) => {
        try {
          // Check if user already exists
          const existingUser = await prisma.user.findFirst({
            where: {
              OR: [
                { email: userData.email },
                { phone: userData.phone }
              ]
            }
          })

          if (existingUser) {
            return {
              fullName: userData.fullName,
              success: false,
              error: 'User already exists'
            }
          }

          // Create user and participant
          const { user, participant } = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
              data: {
                fullName: userData.fullName,
                email: userData.email,
                phone: userData.phone,
                role: 'PARTICIPANT',
                password: await hash(Math.random().toString(36), 12)
              }
            })

            const participant = await tx.participant.create({
              data: {
                userId: user.id,
                state: userData.state,
                lga: userData.lga,
                chapter: userData.chapter,
                organization: userData.organization,
                position: userData.position,
                paymentStatus: 'PENDING',
                accreditationStatus: 'PENDING'
              }
            })

            return { user, participant }
          })

          return {
            id: participant.id,
            fullName: user.fullName,
            success: true
          }
        } catch (error: any) {
          return {
            fullName: userData.fullName,
            success: false,
            error: error?.message || 'Unknown error occurred'
          }
        }
      })
    )

    revalidatePath('/admin/participants')
    return results
  } catch (error) {
    console.error('Error pre-registering users:', error)
    throw error
  }
}

export async function deleteUser(userId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const admin = await prisma.admin.findFirst({
      where: { userId: session.user.id }
    })
    if (!admin) throw new Error('Unauthorized')

    // Delete user and related data in transaction
    await prisma.$transaction(async (tx) => {
      // Delete participant if exists
      await tx.participant.deleteMany({
        where: { userId }
      })

      // Delete validator if exists
      await tx.validator.deleteMany({
        where: { userId }
      })

      // Delete admin if exists
      await tx.admin.deleteMany({
        where: { userId }
      })

      // Finally delete user
      await tx.user.delete({
        where: { id: userId }
      })
    })

    revalidatePath('/admin/participants')
    return { success: true }
  } catch (error) {
    console.error('Error deleting user:', error)
    throw error
  }
}

export async function setUserRole(userId: string, role: 'PARTICIPANT' | 'VALIDATOR' | 'ADMIN') {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const admin = await prisma.admin.findFirst({
      where: { userId: session.user.id }
    })
    if (!admin) throw new Error('Unauthorized')

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

      // Create new role record
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

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    console.error('Error setting user role:', error)
    throw error
  }
}

export async function generateParticipantCode(participantId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const admin = await prisma.admin.findFirst({
      where: { userId: session.user.id }
    })
    if (!admin) throw new Error('Unauthorized')

    const referenceCode = await generateParticipantReference()

    await prisma.participant.update({
      where: { id: participantId },
      data: { referenceCode }
    })

    revalidatePath('/admin/participants')
    return { referenceCode }
  } catch (error) {
    console.error('Error generating participant code:', error)
    throw error
  }
}

export async function getUsersByRole(role: 'PARTICIPANT' | 'VALIDATOR' | 'ADMIN') {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const admin = await prisma.admin.findFirst({
      where: { userId: session.user.id }
    })
    if (!admin) throw new Error('Unauthorized')

    const users = await prisma.user.findMany({
      where: { role },
      include: {
        participant: true,
        validator: true,
        admin: true
      },
      orderBy: { fullName: 'asc' }
    })

    return users.map(user => ({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      // Additional role-specific data
      ...(user.participant && {
        state: user.participant.state,
        referenceCode: user.participant.referenceCode,
        paymentStatus: user.participant.paymentStatus,
        accreditationStatus: user.participant.accreditationStatus
      })
    }))
  } catch (error) {
    console.error('Error getting users by role:', error)
    throw error
  }
}

export async function resetUserPassword(userId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const admin = await prisma.admin.findFirst({
      where: { userId: session.user.id }
    })
    if (!admin) throw new Error('Unauthorized')

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8)
    const hashedPassword = await hash(tempPassword, 12)

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    })

    return { tempPassword }
  } catch (error) {
    console.error('Error resetting password:', error)
    throw error
  }
}

export async function getValidators() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const admin = await prisma.admin.findFirst({
      where: { userId: session.user.id }
    })
    if (!admin) throw new Error('Unauthorized')

    // Get all validators with user data and scan counts
    const validators = await prisma.validator.findMany({
      include: {
        user: true,
        scans: true
      },
      orderBy: {
        user: {
          createdAt: 'desc'
        }
      }
    })

    // Transform data to match expected format
    return validators.map(validator => {
      const totalScans = validator.scans.length
      const todayScans = validator.scans.filter(scan => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return scan.scannedAt >= today
      }).length

      return {
        id: validator.id,
        email: validator.user.email,
        full_name: validator.user.fullName,
        phone: validator.user.phone,
        created_at: validator.user.createdAt,
        total_scans: totalScans,
        today_scans: todayScans
      }
    })
  } catch (error) {
    console.error('Error getting validators:', error)
    throw error
  }
}

export async function createValidator(data: {
  email: string
  password: string
  full_name: string
  phone: string
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    // Validate email format
    if (!data.email || !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(data.email)) {
      throw new Error('Invalid email format')
    }

    // Validate phone format
    if (!data.phone || !/^\d{10,11}$/.test(data.phone)) {
      throw new Error('Phone number must be 10 or 11 digits')
    }

    // Validate required fields
    if (!data.full_name || data.full_name.trim().length < 3) {
      throw new Error('Full name is required and must be at least 3 characters')
    }

    if (!data.password || data.password.length < 8) {
      throw new Error('Password must be at least 8 characters')
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { phone: data.phone }
        ]
      }
    })

    if (existingUser) {
      const field = existingUser.email === data.email ? 'email' : 'phone'
      throw new Error(`This ${field} is already in use`)
    }

    // Create validator in transaction
    const { user, validator } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: await hash(data.password, 10),
          fullName: data.full_name,
          phone: data.phone,
          role: 'VALIDATOR'
        }
      })

      const validator = await tx.validator.create({
        data: {
          userId: user.id
        }
      })

      return { user, validator }
    })

    revalidatePath('/admin/validators')
    return validator.id
  } catch (error) {
    console.error('Error creating validator:', error)
    throw error
  }
}

