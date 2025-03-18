import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { GoogleDriveStorage, GoogleDriveStorageError } from '@/lib/google-drive-storage';
import { withTransaction, query } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  console.log('[UploadAPI] Received new payment proof upload request');
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image (JPG/PNG) or PDF' },
        { status: 400 }
      );
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      );
    }

    // Check payment status
    const profile = await query(
      'SELECT payment_status FROM profiles WHERE id = $1',
      [session.user.id]
    );

    if (!profile.rows[0]) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    if (profile.rows[0].payment_status === 'completed') {
      return NextResponse.json(
        { error: 'Payment has already been completed' },
        { status: 400 }
      );
    }

    // Upload file
    console.log('[UploadAPI] Converting file to buffer...');
    const buffer = Buffer.from(await file.arrayBuffer());
    
    console.log('[UploadAPI] Uploading file to Google Drive...');
    const storage = GoogleDriveStorage.getInstance();
    let fileUrl: string;
    
    try {
      fileUrl = await storage.uploadFile(buffer, file.name, file.type);
    } catch (error) {
      if (error instanceof GoogleDriveStorageError) {
        console.error('[UploadAPI] Storage error:', error.originalError);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
      throw error;
    }

    // Update database
    console.log('[UploadAPI] Updating database with new proof...');
    await withTransaction(async (client) => {
      // Get current payment proof if any
      const result = await client.query(
        'SELECT payment_proof FROM profiles WHERE id = $1',
        [session.user.id]
      );

      // Delete old file if exists
      if (result.rows[0]?.payment_proof) {
        try {
          await storage.deleteFile(result.rows[0].payment_proof);
        } catch (error) {
          console.warn('[UploadAPI] Failed to delete old proof:', error);
          // Continue with update as this is not critical
        }
      }

      // Update profile with new proof
      await client.query(
        `UPDATE profiles 
         SET payment_proof = $1,
             payment_status = 'proof_submitted',
             updated_at = NOW()
         WHERE id = $2`,
        [fileUrl, session.user.id]
      );
    });

    // Revalidate relevant pages
    console.log('[UploadAPI] Revalidating pages...');
    revalidatePath('/payment');
    revalidatePath('/participant/dashboard');
    revalidatePath('/admin/payments');

    console.log('[UploadAPI] Upload completed successfully');
    return NextResponse.json({
      success: true,
      url: fileUrl
    });
  } catch (error: any) {
    console.error('[UploadAPI] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while uploading your payment proof. Please try again.' },
      { status: 500 }
    );
  }
}