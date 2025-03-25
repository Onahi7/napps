'use server'
import { query, withTransaction } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getConfig } from '@/lib/config-service'
import { revalidatePath } from 'next/cache'

class PaymentError extends Error {
  constructor(message: string, public code: string, public source: string, public originalError?: any) {
    super(message);
    this.name = 'PaymentError';
  }
}

async function retryFetch(url: string, options: RequestInit, retries = 3): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Cache-Control': 'no-cache' // Prevent caching issues
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Request failed');
      }
      
      return response;
    } catch (error: any) {
      lastError = error;
      if (i < retries - 1) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, i), 5000)));
        continue;
      }
    }
  }
  
  throw lastError || new Error('Failed after retries');
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
    // Convert file to FormData
    const formData = new FormData();
    formData.append('file', file);

    const response = await retryFetch('/api/upload-proof', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new PaymentError(
        error.error || 'Failed to upload payment proof',
        'UPLOAD_ERROR',
        'upload'
      );
    }

    const { url: fileUrl } = await response.json();

    revalidatePath('/payment');
    revalidatePath('/participant/dashboard');
    revalidatePath('/admin/payments');

    return { success: true, fileUrl };
  } catch (error: any) {
    console.error('[PaymentActions] Payment proof upload error:', error);
    
    // Enhance error messages for common network issues
    if (error.message?.includes('fetch')) {
      throw new PaymentError(
        'Network connection error. Please check your internet connection and try again.',
        'NETWORK_ERROR',
        'fetch',
        error
      );
    }
    
    if (error instanceof PaymentError) {
      throw error;
    }
    
    throw new PaymentError(
      error.message || 'An unexpected error occurred',
      'UNKNOWN_ERROR',
      'payment-action',
      error
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
      `SELECT p.payment_status, p.payment_amount, p.payment_date, p.payment_proof, p.phone 
       FROM profiles p 
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

// Function to update payment status after WhatsApp proof submission
export async function updateWhatsappProofStatus(phoneNumber: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')
  
  try {
    await query(
      `UPDATE profiles 
       SET payment_status = 'whatsapp_proof_submitted',
           updated_at = NOW()
       WHERE id = $1`,
      [session.user.id]
    )
    
    revalidatePath('/payment')
    revalidatePath('/participant/dashboard')
    revalidatePath('/admin/payments')
    
    return { success: true }
  } catch (error: any) {
    console.error('WhatsApp proof status update error:', error)
    throw new Error('Failed to update payment status')
  }
}

// Function for admins to get all payments with WhatsApp proof submissions
export async function getWhatsappProofSubmissions() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.role || session.user.role !== 'admin') throw new Error('Unauthorized')
  
  try {
    const result = await query(
      `SELECT p.id, p.full_name, p.email, p.phone, p.payment_amount, p.payment_status
       FROM profiles p 
       WHERE p.payment_status = 'whatsapp_proof_submitted'
       ORDER BY p.updated_at DESC`,
      []
    )
    
    return result.rows
  } catch (error) {
    console.error('Error fetching WhatsApp proof submissions:', error)
    throw error
  }
}

