'use server'

import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth-options'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function createValidatorAssignment(data: {
  validatorId: string
  location: string
  scheduleDate: Date
  scheduleTime: string
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  // Calculate end time by adding 4 hours to start time
  const [hour, minute] = data.scheduleTime.split(':').map(Number)
  const endHour = (hour + 4) % 24
  const endTime = `${endHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`

  await prisma.assignment.create({
    data: {
      validatorId: data.validatorId,
      location: data.location,
      date: data.scheduleDate,
      startTime: data.scheduleTime,
      endTime: endTime,
      type: 'CHECK_IN',
      status: 'PENDING',
    }
  })

  revalidatePath('/admin/validators')
  revalidatePath('/validator/dashboard')
  return { success: true }
}

export async function getAllAssignments() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const assignments = await prisma.assignment.findMany({
      include: {
        validator: {
          include: {
            user: true
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    })

    return assignments.map(assignment => ({
      id: assignment.id,
      location: assignment.location,
      date: assignment.date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      startTime: assignment.startTime,
      endTime: assignment.endTime,
      type: assignment.type,
      status: assignment.status,
      validatorId: assignment.validatorId,
      validatorName: assignment.validator.user.fullName,
      validatorPhone: assignment.validator.user.phone
    }))
  } catch (error) {
    console.error('Error getting assignments:', error)
    throw error
  }
}

export async function getValidatorAssignments(validatorId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const assignments = await prisma.assignment.findMany({
      where: {
        validatorId,
        date: {
          gte: new Date()
        }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    })

    return assignments.map(assignment => ({
      ...assignment,
      date: assignment.date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    }))
  } catch (error) {
    console.error('Error getting validator assignments:', error)
    throw error
  }
}

export async function updateAssignmentStatus(assignmentId: string, status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED') {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    await prisma.assignment.update({
      where: { id: assignmentId },
      data: { status }
    })

    revalidatePath('/validator/dashboard')
    revalidatePath('/admin/validators')
    return { success: true }
  } catch (error) {
    console.error('Error updating assignment status:', error)
    throw error
  }
}