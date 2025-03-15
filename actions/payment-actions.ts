'use server'
import { query, withTransaction } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getConfig } from '@/lib/config-service'
import { revalidatePath } from 'next/cache'
import { StorageService } from '@/lib/storage'
import { v4 as uuidv4 } from 'uuid'

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
           payment_proof = NULL,
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

export async function uploadPaymentProof(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  const file = formData.get('file') as File
  if (!file) throw new Error('No file provided')

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload an image (JPG/PNG) or PDF')
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File too large. Maximum size is 5MB')
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.name.split('.').pop()
    const fileName = `payment-proofs/${session.user.id}-${uuidv4()}.${ext}`

    const storage = StorageService.getInstance()
    const fileUrl = await storage.uploadFile(buffer, fileName, file.type)

    // Save file URL to database
    await query(
      'UPDATE payments SET proof_url = $1, proof_uploaded_at = NOW() WHERE user_id = $2',
      [fileUrl, session.user.id]
    )

    revalidatePath('/payment')
    revalidatePath('/admin/payments')
    return { success: true, url: fileUrl }
  } catch (error) {
    console.error('Error uploading payment proof:', error)
    throw new Error('Failed to upload payment proof')
  }
}

export async function verifyPayment(reference: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  return await withTransaction(async (client) => {
    const profile = await client.query(
      'SELECT payment_status FROM profiles WHERE payment_reference = $1',
      [reference]
    )

    if (!profile.rows[0]) {
      throw new Error('Payment reference not found')
    }

    if (profile.rows[0].payment_status === 'completed') {
      throw new Error('Payment already verified')
    }

    await client.query(
      `UPDATE profiles 
       SET payment_status = 'completed',
           updated_at = NOW()
       WHERE payment_reference = $1`,
      [reference]
    )

    revalidatePath('/admin/payments')
    revalidatePath('/participant/dashboard')
    return { verified: true }
  })
}

export async function getPaymentStatus() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const result = await query(
    `SELECT payment_status, payment_reference, payment_amount, payment_date, payment_proof 
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

