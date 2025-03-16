'use server'
import { query, withTransaction } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getConfig } from '@/lib/config-service'
import { revalidatePath } from 'next/cache'
import { StorageService } from '@/lib/storage'

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
  console.log('Starting payment proof upload...');
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.error('Upload failed: Unauthorized - No session');
      throw new Error('Unauthorized');
    }

    const file = formData.get('file') as File;
    if (!file) {
      console.error('Upload failed: Missing file');
      throw new Error('Please select a file to upload');
    }

    console.log('File received:', file.name, 'type:', file.type, 'size:', file.size);

    try {
      const profile = await query(
        'SELECT p.payment_status, u.phone FROM profiles p JOIN users u ON p.id = u.id WHERE p.id = $1',
        [session.user.id]
      );

      if (profile.rowCount === 0) {
        console.error('Upload failed: Profile not found for user ID', session.user.id);
        throw new Error('Profile not found');
      }

      console.log('Profile found, payment status:', profile.rows[0].payment_status);

      if (profile.rows[0].payment_status === 'completed') {
        console.error('Upload failed: Payment already completed');
        throw new Error('Payment already completed');
      }

      console.log('Validating file...');
      const buffer = Buffer.from(await file.arrayBuffer());
      
      if (buffer.length > 5 * 1024 * 1024) {
        throw new Error('File size too large. Maximum size is 5MB');
      }

      if (!['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'].includes(file.type)) {
        throw new Error('Invalid file type. Please upload an image (JPG/PNG) or PDF');
      }

      const fileName = `payment-proofs/${session.user.id}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      console.log('Uploading to storage...', fileName);
      
      try {
        const storage = StorageService.getInstance();
        console.log('Storage service initialized');
        
        const fileUrl = await storage.uploadFile(buffer, fileName, file.type);
        console.log('File uploaded successfully to:', fileUrl);

        console.log('Updating database with file URL...');
        await withTransaction(async (client) => {
          await client.query(
            `UPDATE profiles 
             SET payment_proof = $1,
                 payment_status = 'proof_submitted',
                 updated_at = NOW()
             WHERE id = $2`,
            [fileUrl, session.user.id]
          );
        });

        console.log('Database updated successfully');
        revalidatePath('/payment');
        revalidatePath('/participant/dashboard');
        revalidatePath('/admin/payments');

        return { success: true, fileUrl };
      } catch (storageError: any) {
        console.error('Storage service error:', storageError);
        if (storageError.name === 'CredentialsProviderError') {
          throw new Error('Storage configuration issue. Please contact support.');
        } else if (storageError.name === 'NoSuchBucket') {
          throw new Error('Storage bucket not found. Please contact support.');
        } else {
          throw new Error(`Storage error: ${storageError.message || 'Unknown storage error'}`);
        }
      }

    } catch (dbError: any) {
      console.error('Database error:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

  } catch (error: any) {
    console.error('Payment proof upload error:', error);
    throw new Error(error.message || 'Failed to upload payment proof');
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

