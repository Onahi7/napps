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

  let retries = 3;
  while (retries > 0) {
    try {
      // First check if database is responding
      await query('SELECT 1');
      
      const profile = await query(
        'SELECT payment_status, payment_reference FROM profiles WHERE id = $1',
        [session.user.id]
      )

      if (profile.rows[0]?.payment_status === 'completed') {
        throw new Error('Payment already completed')
      }

      // Generate new reference if none exists
      const paymentReference = profile.rows[0]?.payment_reference || 
        `NAPPS-${Date.now()}-${Math.random().toString(36).substring(7)}`
      
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
      retries--;
      console.error(`Payment initialization error (attempts left: ${retries}):`, error)
      
      // Check if error is retryable (connection issues)
      const retryableError = 
        error.message?.includes('connection') || 
        error.message?.includes('timeout') ||
        error.message?.includes('Connection terminated');
        
      if (!retryableError || retries === 0) {
        if (error.message?.includes('connection') || error.message?.includes('timeout')) {
          throw new Error('Database connection issue. Please try again in a few moments.')
        }
        throw error;
      }
      
      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, 3-retries), 8000)));
    }
  }
  
  throw new Error('Failed to initialize payment after retries')
}

export async function uploadPaymentProof(formData: FormData) {
  console.log('Starting payment proof upload...');
  
  try {
    // Step 1: Check session and authorization
    console.log('Verifying session...');
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.error('Upload failed: Unauthorized - No session');
      throw new Error('Unauthorized');
    }

    // Step 2: Get and validate file from form data
    const file = formData.get('file') as File;
    const reference = formData.get('reference') as string;

    if (!file) {
      console.error('Upload failed: Missing file');
      throw new Error('Please select a file to upload');
    }

    console.log('File received:', file.name, 'type:', file.type, 'size:', file.size);

    // Step 3: Check user profile and payment status
    console.log('Checking profile data...');
    try {
      const profile = await query(
        'SELECT payment_reference, payment_status FROM profiles WHERE id = $1',
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

      // If no reference exists, generate one
      const paymentReference = profile.rows[0].payment_reference || reference || 
        `NAPPS-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      console.log('Using payment reference:', paymentReference);

      // Step 4: Validate file format and size
      console.log('Validating file...');
      const buffer = Buffer.from(await file.arrayBuffer());
      
      if (buffer.length > 5 * 1024 * 1024) {
        throw new Error('File size too large. Maximum size is 5MB');
      }

      if (!['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'].includes(file.type)) {
        throw new Error('Invalid file type. Please upload an image (JPG/PNG) or PDF');
      }

      // Step 5: Upload to storage
      const fileName = `payment-proofs/${session.user.id}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      console.log('Uploading to storage...', fileName);
      
      try {
        const storage = StorageService.getInstance();
        console.log('Storage service initialized');
        
        const fileUrl = await storage.uploadFile(buffer, fileName, file.type);
        console.log('File uploaded successfully to:', fileUrl);

        // Step 6: Update database with payment proof
        console.log('Updating database with file URL...');
        await withTransaction(async (client) => {
          await client.query(
            `UPDATE profiles 
             SET payment_proof = $1,
                 payment_status = 'proof_submitted',
                 payment_reference = $2,
                 updated_at = NOW()
             WHERE id = $3`,
            [fileUrl, paymentReference, session.user.id]
          );
        });

        console.log('Database updated successfully');
        revalidatePath('/payment');
        revalidatePath('/participant/dashboard');
        revalidatePath('/admin/payments');

        return { success: true, fileUrl };
      } catch (storageError: any) {
        console.error('Storage service error:', storageError);
        // Provide more specific error message for storage issues
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
  return getConfig('registrationAmount') || 20000
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

