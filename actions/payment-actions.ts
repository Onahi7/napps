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

export async function uploadPaymentProof(formData: FormData) {
  console.log('[PaymentActions] Starting payment proof upload...');
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new PaymentError('No authenticated session found', 'AUTH_ERROR', 'session-check');
    }

    const file = formData.get('file') as File;
    if (!file) {
      throw new PaymentError('Please select a file to upload', 'VALIDATION_ERROR', 'file-check');
    }

    // Validate file type and size on server side
    if (!['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'].includes(file.type)) {
      throw new PaymentError(
        'Invalid file type. Please upload an image (JPG/PNG) or PDF',
        'VALIDATION_ERROR',
        'file-type-check'
      );
    }

    // Convert File to Buffer using Blob and arrayBuffer
    const blob = new Blob([file]);
    const arrayBuffer = await blob.arrayBuffer().catch(error => {
      console.error('[PaymentActions] Error converting file to array buffer:', error);
      throw new PaymentError(
        'Failed to process file',
        'FILE_PROCESSING_ERROR',
        'array-buffer-conversion'
      );
    });
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > 5 * 1024 * 1024) {
      throw new PaymentError(
        'File size too large. Maximum size is 5MB',
        'VALIDATION_ERROR',
        'file-size-check'
      );
    }

    const result = await query(
      'SELECT payment_status FROM profiles WHERE id = $1',
      [session.user.id]
    ).catch(error => {
      console.error('[PaymentActions] Database query error:', error);
      throw new PaymentError(
        'Failed to verify payment status',
        'DATABASE_ERROR',
        'payment-status-check'
      );
    });

    if (result.rowCount === 0) {
      throw new PaymentError('Profile not found', 'NOT_FOUND_ERROR', 'profile-check');
    }

    if (result.rows[0].payment_status === 'completed') {
      throw new PaymentError('Payment already completed', 'VALIDATION_ERROR', 'payment-status-check');
    }

    const fileName = `payment-proofs/${session.user.id}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    try {
      const storage = StorageService.getInstance();
      const fileUrl = await storage.uploadFile(buffer, fileName, file.type);

      await withTransaction(async (client) => {
        // Delete old payment proof if exists
        const oldProof = await client.query(
          'SELECT payment_proof FROM profiles WHERE id = $1',
          [session.user.id]
        );
        
        if (oldProof.rows[0]?.payment_proof) {
          try {
            await storage.deleteFile(oldProof.rows[0].payment_proof);
          } catch (error) {
            console.error('[PaymentActions] Failed to delete old payment proof:', error);
            // Continue with the update as this is not a critical error
          }
        }

        await client.query(
          `UPDATE profiles 
           SET payment_proof = $1,
               payment_status = 'proof_submitted',
               updated_at = NOW()
           WHERE id = $2`,
          [fileUrl, session.user.id]
        ).catch((error: Error) => {
          console.error('[PaymentActions] Failed to update profile with payment proof:', error);
          throw new PaymentError(
            'Failed to save payment proof',
            'DATABASE_ERROR',
            'profile-update'
          );
        });
      });

      revalidatePath('/payment');
      revalidatePath('/participant/dashboard');
      revalidatePath('/admin/payments');

      return { success: true, fileUrl };
    } catch (storageError: any) {
      console.error('[PaymentActions] Storage error:', storageError);
      if (storageError.name === 'CredentialsProviderError') {
        throw new PaymentError(
          'Storage configuration issue. Please contact support.',
          'STORAGE_ERROR',
          'credentials'
        );
      } else if (storageError.name === 'NoSuchBucket') {
        throw new PaymentError(
          'Storage bucket not found. Please contact support.',
          'STORAGE_ERROR',
          'bucket-missing'
        );
      } else {
        throw new PaymentError(
          'Failed to upload file. Please try again.',
          'STORAGE_ERROR',
          'upload'
        );
      }
    }
  } catch (error: any) {
    console.error('[PaymentActions] Payment proof upload error:', {
      name: error.name,
      message: error.message,
      code: error.code,
      source: error.source,
      stack: error.stack
    });
    
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

