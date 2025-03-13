'use server'
import { query, withTransaction } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getConfig } from '@/lib/config-service'
import { revalidatePath } from 'next/cache'

export async function initializePayment(amount: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const profile = await query(
      'SELECT payment_status FROM profiles WHERE id = $1',
      [session.user.id]
    )

    if (profile.rows[0]?.payment_status === 'completed') {
      throw new Error('Payment already completed')
    }

    const paymentReference = `NAPPS-${Date.now()}-${Math.random().toString(36).substring(7)}`
    
    await query(
      `UPDATE profiles 
       SET payment_reference = $1, 
           payment_amount = $2,
           payment_status = 'pending',
           updated_at = NOW()
       WHERE id = $3`,
      [paymentReference, amount, session.user.id]
    )

    return { reference: paymentReference }
  } catch (error: any) {
    console.error('Payment initialization error:', error)
    throw error
  }
}

export async function verifyPayment(reference: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  return await withTransaction(async (client) => {
    // Get profile and verify payment status
    const profile = await client.query(
      'SELECT payment_status, payment_reference FROM profiles WHERE id = $1',
      [session.user.id]
    )

    if (!profile.rows[0]) throw new Error('Profile not found')
    if (profile.rows[0].payment_reference !== reference) {
      throw new Error('Invalid payment reference')
    }
    if (profile.rows[0].payment_status === 'completed') {
      return { verified: true }
    }

    // Update payment status
    await client.query(
      `UPDATE profiles 
       SET payment_status = 'completed',
           payment_date = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [session.user.id]
    )

    revalidatePath('/payment')
    revalidatePath('/participant/dashboard')
    return { verified: true }
  })
}

export async function getPaymentStatus() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const result = await query(
    `SELECT payment_status, payment_reference, payment_amount, payment_date 
     FROM profiles 
     WHERE id = $1`,
    [session.user.id]
  )

  return result.rows[0] || null
}

export async function getRegistrationAmount() {
  return getConfig('registrationAmount') || 15000
}

// Function to verify registration payment
export async function verifyRegistrationPayment(reference: string) {
  return verifyPayment(reference);
}

// Function to verify hotel booking payment
export async function verifyHotelBookingPayment(reference: string, bookingId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')
  
  return await withTransaction(async (client) => {
    // Verify the booking exists and belongs to the user
    const booking = await client.query(
      'SELECT id, payment_status FROM bookings WHERE id = $1 AND user_id = $2',
      [bookingId, session.user.id]
    )
    
    if (!booking.rows[0]) throw new Error('Booking not found')
    
    if (booking.rows[0].payment_status === 'completed') {
      return { verified: true }
    }
    
    // Update booking payment status
    await client.query(
      `UPDATE bookings 
       SET payment_status = 'completed',
           payment_date = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [bookingId]
    )
    
    revalidatePath('/participant/accommodation')
    return { verified: true }
  })
}

