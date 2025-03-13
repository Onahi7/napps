'use server'

import { query, withTransaction } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { revalidatePath } from 'next/cache'

export async function getHotels() {
  const result = await query(
    'SELECT * FROM hotels ORDER BY price_per_night ASC'
  )
  return result.rows
}

export async function getHotel(hotelId: string) {
  const result = await query(
    'SELECT * FROM hotels WHERE id = $1',
    [hotelId]
  )
  return result.rows[0] || null
}

export async function createHotel(data: {
  name: string
  description?: string
  address?: string
  price_per_night: number
  image_url?: string
  available_rooms?: number
  amenities?: any[]
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  const result = await query(
    `INSERT INTO hotels (
      name, description, address, price_per_night, 
      image_url, available_rooms, amenities
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id`,
    [
      data.name,
      data.description,
      data.address,
      data.price_per_night,
      data.image_url,
      data.available_rooms || 0,
      JSON.stringify(data.amenities || [])
    ]
  )

  revalidatePath('/admin/hotels')
  return result.rows[0].id
}

export async function updateHotel(hotelId: string, data: {
  name?: string
  description?: string
  address?: string
  price_per_night?: number
  image_url?: string
  available_rooms?: number
  amenities?: any[]
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  const fields = Object.keys(data)
  const values = Object.values(data)
  const setClause = fields.map((field, i) => {
    if (field === 'amenities') {
      values[i] = JSON.stringify(values[i])
    }
    return `${field} = $${i + 2}`
  }).join(', ')

  await query(
    `UPDATE hotels 
     SET ${setClause}, updated_at = NOW()
     WHERE id = $1`,
    [hotelId, ...values]
  )

  revalidatePath('/admin/hotels')
  return { success: true }
}

export async function deleteHotel(hotelId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  await query(
    'DELETE FROM hotels WHERE id = $1',
    [hotelId]
  )

  revalidatePath('/admin/hotels')
  return { success: true }
}

export async function createBooking(hotelId: string, data: {
  check_in_date: Date
  check_out_date: Date
  total_amount: number
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  return await withTransaction(async (client) => {
    // Check hotel availability
    const hotel = await client.query(
      'SELECT available_rooms FROM hotels WHERE id = $1',
      [hotelId]
    )

    if (!hotel.rows[0] || hotel.rows[0].available_rooms < 1) {
      throw new Error('No rooms available')
    }

    // Create booking
    const booking = await client.query(
      `INSERT INTO bookings (
        user_id, hotel_id, check_in_date, check_out_date, 
        total_amount, status, payment_status
      ) VALUES ($1, $2, $3, $4, $5, 'confirmed', 'pending')
      RETURNING id`,
      [
        session.user.id,
        hotelId,
        data.check_in_date,
        data.check_out_date,
        data.total_amount
      ]
    )

    // Update hotel availability
    await client.query(
      'UPDATE hotels SET available_rooms = available_rooms - 1 WHERE id = $1',
      [hotelId]
    )

    revalidatePath('/participant/accommodation')
    return booking.rows[0].id
  })
}

export async function getUserBookings() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  const result = await query(
    `SELECT b.*, h.name as hotel_name, h.address
     FROM bookings b
     JOIN hotels h ON b.hotel_id = h.id
     WHERE b.user_id = $1
     ORDER BY b.created_at DESC`,
    [session.user.id]
  )

  return result.rows
}

export async function getAllBookings() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  const result = await query(
    `SELECT b.*, h.name as hotel_name, h.address,
            p.full_name, p.email, p.phone
     FROM bookings b
     JOIN hotels h ON b.hotel_id = h.id
     JOIN profiles p ON b.user_id = p.id
     ORDER BY b.created_at DESC`
  )

  return result.rows
}

