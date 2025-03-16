'use server'
import { query, withTransaction } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getConfig } from '@/lib/config-service'
import { revalidatePath } from 'next/cache'
import { StorageService } from '@/lib/storage'

class PaymentError extends Error {
  constructor(message: string, public code: string, public source: string) {
    super(message);
    this.name = 'PaymentError';
  }
}

export async function initializePayment(amount: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    await query('SELECT 1');
    
    const profile = await query(
      'SELECT payment_status FROM profiles p WHERE p.id = $1',
      [session.user.id]
    )

    if (profile.rows[0]?.payment_status === 'completed') {
      throw new Error('Payment already completed')
    }

    await query(
      `UPDATE profiles 
       SET payment_amount = $1,
           payment_status = 'pending',
           payment_proof = NULL,
           updated_at = NOW()
       WHERE id = $2`,
      [amount, session.user.id]
    )

    return { success: true }
  } catch (error: any) {
    console.error('Payment initialization error:', error)
    throw new Error('Failed to initialize payment')
  }
}

export async function uploadPaymentProof(file: File) {
  try {
    // First get a presigned URL
    const response = await fetch('/api/presigned-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileType: file.type,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new PaymentError(error.error || 'Failed to get upload URL', 'STORAGE_ERROR', 'presign');
    }

    const { presignedUrl, fileUrl } = await response.json();

    // Upload directly to DigitalOcean Spaces
    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new PaymentError('Failed to upload file', 'STORAGE_ERROR', 'upload');
    }

    // Update profile with new proof URL
    const updateResponse = await fetch('/api/payment-proof', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileUrl,
      }),
    });

    if (!updateResponse.ok) {
      throw new PaymentError('Failed to save payment proof', 'DATABASE_ERROR', 'profile-update');
    }

    revalidatePath('/payment');
    revalidatePath('/participant/dashboard');
    revalidatePath('/admin/payments');

    return { success: true, fileUrl };
  } catch (error: any) {
    console.error('[PaymentActions] Payment proof upload error:', error);
    if (error instanceof PaymentError) {
      throw error;
    }
    throw new PaymentError(
      error.message || 'An unexpected error occurred',
      'UNKNOWN_ERROR',
      'payment-action'
    );
  }
}

export async function verifyPayment(reference: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  return await withTransaction(async (client) => {
    const profile = await client.query(
      'SELECT payment_status FROM profiles WHERE id = $1',
      [session.user.id]
    )

    if (!profile.rows[0]) {
      throw new Error('Profile not found')
    }

    if (profile.rows[0].payment_status === 'completed') {
      throw new Error('Payment already verified')
    }

    await client.query(
      `UPDATE profiles 
       SET payment_status = 'completed',
           updated_at = NOW()
       WHERE id = $1`,
      [session.user.id]
    )

    revalidatePath('/admin/payments')
    revalidatePath('/participant/dashboard')
    return { verified: true }
  })
}

export async function getPaymentStatus() {
  const session = await getServerSession(authOptions);
  console.log('Getting payment status for user:', session?.user?.id);
  
  if (!session?.user?.id) {
    console.log('No user session found');
    return null;
  }

  try {
    const result = await query(
      `SELECT p.payment_status, p.payment_amount, p.payment_date, p.payment_proof, u.phone 
       FROM profiles p 
       JOIN users u ON p.id = u.id 
       WHERE p.id = $1`,
      [session.user.id]
    );
    
    console.log('Payment status query result:', result.rows[0]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting payment status:', error);
    throw error;
  }
}

export async function getRegistrationAmount() {
  return getConfig('registrationAmount') || 20000
}

// Function to verify registration payment
export async function verifyRegistrationPayment() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  return await withTransaction(async (client) => {
    const profile = await client.query(
      'SELECT payment_status FROM profiles WHERE id = $1',
      [session.user.id]
    )

    if (!profile.rows[0]) {
      throw new Error('Profile not found')
    }

    if (profile.rows[0].payment_status === 'completed') {
      return { verified: true }
    }

    await client.query(
      `UPDATE profiles 
       SET payment_status = 'completed',
           updated_at = NOW()
       WHERE id = $1`,
      [session.user.id]
    )

    revalidatePath('/admin/payments')
    revalidatePath('/participant/dashboard')
    return { verified: true }
  })
}

// Function to verify hotel booking payment
export async function verifyHotelBookingPayment(reference: string, bookingId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')
  
  return await withTransaction(async (client) => {
    const booking = await client.query(
      'SELECT id, payment_status FROM bookings WHERE id = $1 AND user_id = $2',
      [bookingId, session.user.id]
    )
    
    if (!booking.rows[0]) throw new Error('Booking not found')
    
    if (booking.rows[0].payment_status === 'completed') {
      return { verified: true }
    }
    
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

