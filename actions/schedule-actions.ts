'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { revalidatePath } from 'next/cache'
import { PrismaClient } from '@prisma/client'
import { EventType } from '@/lib/database.types'

export interface ScheduleEvent {
  id: string
  title: string
  description: string | null
  day: number
  startTime: string
  endTime: string
  venue: string | null
  type: EventType
  speakers: string[]
}

const prisma = new PrismaClient()

export async function createEvent(data: {
  title: string
  description?: string
  day: number
  startTime: string
  endTime: string
  venue?: string
  type: 'SESSION' | 'BREAK' | 'REGISTRATION' | 'SPECIAL'
  speakers: string[]
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const admin = await prisma.admin.findFirst({
      where: { userId: session.user.id }
    })
    if (!admin) throw new Error('Not an admin')

    // Check for overlapping events in the same venue
    if (data.venue) {
      const overlapping = await prisma.scheduleEvent.findFirst({
        where: {
          day: data.day,
          venue: data.venue,
          OR: [
            {
              AND: [
                { startTime: { lte: data.startTime } },
                { endTime: { gt: data.startTime } }
              ]
            },
            {
              AND: [
                { startTime: { lt: data.endTime } },
                { endTime: { gte: data.endTime } }
              ]
            }
          ]
        }
      })

      if (overlapping) {
        throw new Error('There is already an event scheduled in this venue at this time')
      }
    }

    await prisma.scheduleEvent.create({
      data
    })

    revalidatePath('/admin/schedule')
    revalidatePath('/participant/schedule')
    return { success: true }
  } catch (error) {
    console.error('Error creating event:', error)
    throw error
  }
}

export async function updateEvent(id: string, data: {
  title?: string
  description?: string
  day?: number
  startTime?: string
  endTime?: string
  venue?: string
  type?: 'SESSION' | 'BREAK' | 'REGISTRATION' | 'SPECIAL'
  speakers?: string[]
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const admin = await prisma.admin.findFirst({
      where: { userId: session.user.id }
    })
    if (!admin) throw new Error('Not an admin')

    // Check for overlapping events if venue or time is being updated
    if ((data.venue || data.startTime || data.endTime || data.day) && data.venue) {
      const event = await prisma.scheduleEvent.findUnique({
        where: { id }
      })
      if (!event) throw new Error('Event not found')

      const overlapping = await prisma.scheduleEvent.findFirst({
        where: {
          id: { not: id },
          day: data.day || event.day,
          venue: data.venue,
          OR: [
            {
              AND: [
                { startTime: { lte: data.startTime || event.startTime } },
                { endTime: { gt: data.startTime || event.startTime } }
              ]
            },
            {
              AND: [
                { startTime: { lt: data.endTime || event.endTime } },
                { endTime: { gte: data.endTime || event.endTime } }
              ]
            }
          ]
        }
      })

      if (overlapping) {
        throw new Error('There is already an event scheduled in this venue at this time')
      }
    }

    await prisma.scheduleEvent.update({
      where: { id },
      data
    })

    revalidatePath('/admin/schedule')
    revalidatePath('/participant/schedule')
    return { success: true }
  } catch (error) {
    console.error('Error updating event:', error)
    throw error
  }
}

export async function deleteEvent(id: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const admin = await prisma.admin.findFirst({
      where: { userId: session.user.id }
    })
    if (!admin) throw new Error('Not an admin')

    await prisma.scheduleEvent.delete({
      where: { id }
    })

    revalidatePath('/admin/schedule')
    revalidatePath('/participant/schedule')
    return { success: true }
  } catch (error) {
    console.error('Error deleting event:', error)
    throw error
  }
}

export async function getEvents() {
  try {
    const events = await prisma.scheduleEvent.findMany({
      orderBy: [
        { day: 'asc' },
        { startTime: 'asc' }
      ]
    })
    return events
  } catch (error) {
    console.error('Error getting events:', error)
    throw error
  }
}

export async function getEventById(id: string) {
  try {
    const event = await prisma.scheduleEvent.findUnique({
      where: { id }
    })

    if (!event) throw new Error('Event not found')
    return event
  } catch (error) {
    console.error('Error getting event:', error)
    throw error
  }
}

export async function getEventsByVenue(venue: string) {
  try {
    const events = await prisma.scheduleEvent.findMany({
      where: { venue },
      orderBy: [
        { day: 'asc' },
        { startTime: 'asc' }
      ]
    })

    return events
  } catch (error) {
    console.error('Error getting events by venue:', error)
    throw error
  }
}

export async function getEventsByDay(day: number) {
  try {
    const events = await prisma.scheduleEvent.findMany({
      where: { day },
      orderBy: [
        { startTime: 'asc' },
        { venue: 'asc' }
      ]
    })

    return events
  } catch (error) {
    console.error('Error getting events by day:', error)
    throw error
  }
}

export async function getVenueSchedule(venue: string, day: number) {
  try {
    const events = await prisma.scheduleEvent.findMany({
      where: {
        venue,
        day
      },
      orderBy: { startTime: 'asc' }
    })

    return events
  } catch (error) {
    console.error('Error getting venue schedule:', error)
    throw error
  }
}

export async function getSessionAttendance(eventId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const admin = await prisma.admin.findFirst({
      where: { userId: session.user.id }
    })
    if (!admin) throw new Error('Not an admin')

    const scans = await prisma.scan.findMany({
      where: {
        type: 'SESSION',
        notes: eventId // We store the eventId in notes for session scans
      },
      include: {
        participant: {
          include: {
            user: true
          }
        }
      },
      orderBy: { scannedAt: 'desc' }
    })

    return scans.map(scan => ({
      id: scan.id,
      participantName: scan.participant.user.fullName,
      participantEmail: scan.participant.user.email,
      state: scan.participant.state,
      chapter: scan.participant.chapter,
      time: scan.scannedAt.toLocaleString()
    }))
  } catch (error) {
    console.error('Error getting session attendance:', error)
    throw error
  }
}

export async function getScheduleEvents(): Promise<ScheduleEvent[]> {
  try {
    const events = await prisma.scheduleEvent.findMany({
      orderBy: [
        { day: 'asc' },
        { startTime: 'asc' }
      ]
    })
    return events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      day: event.day,
      startTime: event.startTime,
      endTime: event.endTime,
      venue: event.venue,
      type: event.type,
      speakers: event.speakers
    }))
  } catch (error) {
    console.error('Error getting events:', error)
    throw error
  }
}