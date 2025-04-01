'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { revalidatePath } from 'next/cache'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function createHotel(data: {
  name: string
  address: string
  pricePerNight: number
  priceCategory: 'ECONOMY' | 'STANDARD' | 'PREMIUM'
  availableRooms: number
  description?: string
  amenities?: string[]
  contactPhone?: string
  contactWhatsapp?: string
  distanceFromVenue?: number
  rating?: number
  imageUrl?: string
  isFeatured?: boolean
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const admin = await prisma.admin.findFirst({
      where: { userId: session.user.id }
    })
    if (!admin) throw new Error('Not an admin')

    const hotel = await prisma.hotel.create({
      data: {
        name: data.name,
        address: data.address,
        pricePerNight: data.pricePerNight,
        priceCategory: data.priceCategory,
        availableRooms: data.availableRooms,
        description: data.description,
        amenities: data.amenities || [],
        contactPhone: data.contactPhone,
        contactWhatsapp: data.contactWhatsapp,
        distanceFromVenue: data.distanceFromVenue,
        rating: data.rating,
        imageUrl: data.imageUrl,
        isFeatured: data.isFeatured
      }
    })

    revalidatePath('/admin/hotels')
    return { success: true, hotel }
  } catch (error) {
    console.error('Error creating hotel:', error)
    throw error
  }
}

export async function updateHotel(id: string, data: {
  name?: string
  address?: string
  pricePerNight?: number
  priceCategory?: 'ECONOMY' | 'STANDARD' | 'PREMIUM'
  availableRooms?: number
  description?: string
  amenities?: string[]
  contactPhone?: string
  contactWhatsapp?: string
  distanceFromVenue?: number
  rating?: number
  imageUrl?: string
  isFeatured?: boolean
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const admin = await prisma.admin.findFirst({
      where: { userId: session.user.id }
    })
    if (!admin) throw new Error('Not an admin')

    await prisma.hotel.update({
      where: { id },
      data
    })

    revalidatePath('/admin/hotels')
    return { success: true }
  } catch (error) {
    console.error('Error updating hotel:', error)
    throw error
  }
}

export async function deleteHotel(id: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const admin = await prisma.admin.findFirst({
      where: { userId: session.user.id }
    })
    if (!admin) throw new Error('Not an admin')

    // Check if hotel has any accommodations
    const accommodationsExist = await prisma.accommodation.findFirst({
      where: { hotelId: id }
    })

    if (accommodationsExist) {
      throw new Error('Cannot delete hotel with existing accommodations')
    }

    // Delete hotel
    await prisma.hotel.delete({
      where: { id }
    })

    revalidatePath('/admin/hotels')
    return { success: true }
  } catch (error) {
    console.error('Error deleting hotel:', error)
    throw error
  }
}

export async function getHotels() {
  try {
    const hotels = await prisma.hotel.findMany({
      orderBy: { name: 'asc' }
    })

    return hotels
  } catch (error) {
    console.error('Error getting hotels:', error)
    throw error
  }
}

export async function getUserBookings() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const participant = await prisma.participant.findFirst({
      where: { userId: session.user.id }
    })
    if (!participant) throw new Error('Not a participant')

    const bookings = await prisma.accommodation.findMany({
      where: {
        participantId: participant.id
      },
      include: {
        hotel: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return bookings.map(booking => ({
      id: booking.id,
      hotelName: booking.hotel.name,
      checkIn: booking.checkInDate.toISOString(),
      checkOut: booking.checkOutDate.toISOString(),
      status: booking.bookingStatus,
      amount: booking.totalAmount
    }))
  } catch (error) {
    console.error('Error getting user bookings:', error)
    throw error
  }
}

export async function createBooking(data: {
  hotelId: string
  checkInDate: Date
  checkOutDate: Date
  amount: number
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const participant = await prisma.participant.findFirst({
      where: { userId: session.user.id }
    })
    if (!participant) throw new Error('Not a participant')

    const booking = await prisma.accommodation.create({
      data: {
        participantId: participant.id,
        hotelId: data.hotelId,
        checkInDate: data.checkInDate,
        checkOutDate: data.checkOutDate,
        totalAmount: data.amount,
        bookingStatus: 'PENDING',
        paymentStatus: 'PENDING'
      }
    })

    revalidatePath('/participant/accommodation')
    return booking.id
  } catch (error) {
    console.error('Error creating booking:', error)
    throw error
  }
}

export async function cancelHotelBooking(bookingId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const participant = await prisma.participant.findFirst({
      where: { userId: session.user.id }
    })
    if (!participant) throw new Error('Not a participant')

    const booking = await prisma.accommodation.findFirst({
      where: {
        id: bookingId,
        participantId: participant.id
      }
    })
    if (!booking) throw new Error('Booking not found')

    await prisma.accommodation.update({
      where: { id: bookingId },
      data: { bookingStatus: 'CANCELLED' }
    })

    revalidatePath('/participant/accommodation')
    return { success: true }
  } catch (error) {
    console.error('Error cancelling booking:', error)
    throw error
  }
}

