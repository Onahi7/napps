import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { StorageService, StorageError } from '@/lib/storage';
import { withTransaction, query } from '@/lib/db';
import { revalidatePath } from 'next/cache';

interface ErrorResponse {
  error: string;
  code: string;
  source: string;
  details?: any;
}

function createErrorResponse(error: any): { response: ErrorResponse; status: number } {
  console.error('[UploadProofAPI] Error details:', {
    name: error.name,
    message: error.message,
    code: error.code,
    source: error.source,
    metadata: error.$metadata,
    stack: error.stack
  });

  let status = 500;
  const response: ErrorResponse = {
    error: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
    source: 'upload-proof-api'
  };

  if (error instanceof StorageError) {
    response.error = error.message;
    response.code = error.code;
    response.source = error.source;
    
    switch (error.code) {
      case 'CREDENTIALS_MISSING':
      case 'ACCESS_DENIED':
        status = 403;
        break;
      case 'BUCKET_NOT_FOUND':
        status = 404;
        break;
      case 'FILE_TOO_LARGE':
        status = 413;
        break;
      case 'UPLOAD_ERROR':
        status = 500;
        break;
    }
  } else if (error.message === 'Unauthorized') {
    status = 401;
    response.error = 'Authentication required';
    response.code = 'AUTH_ERROR';
  } else if (error.constraint) {
    status = 400;
    response.error = 'Database constraint violation';
    response.code = 'DB_CONSTRAINT_ERROR';
    response.details = { constraint: error.constraint };
  }

  return { response, status };
}

export async function POST(request: NextRequest) {
  console.log('[UploadProofAPI] Starting payment proof upload request');
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_ERROR', source: 'session-check' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'No file uploaded', code: 'VALIDATION_ERROR', source: 'file-check' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'Invalid file type. Please upload an image (JPG/PNG) or PDF',
          code: 'VALIDATION_ERROR',
          source: 'file-type-check'
        },
        { status: 400 }
      );
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: 'File too large. Maximum size is 5MB',
          code: 'VALIDATION_ERROR',
          source: 'file-size-check'
        },
        { status: 400 }
      );
    }

    // Check payment status
    console.log('[UploadProofAPI] Checking payment status');
    const result = await query(
      'SELECT p.payment_status FROM profiles p WHERE p.id = $1',
      [session.user.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Profile not found', code: 'NOT_FOUND_ERROR', source: 'profile-check' },
        { status: 404 }
      );
    }

    if (result.rows[0].payment_status === 'completed') {
      return NextResponse.json(
        { error: 'Payment already completed', code: 'VALIDATION_ERROR', source: 'payment-status-check' },
        { status: 400 }
      );
    }

    // Process file upload
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `payment-proofs/${session.user.id}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    console.log('[UploadProofAPI] Uploading file to storage');
    const storage = StorageService.getInstance();
    const fileUrl = await storage.uploadFile(buffer, fileName, file.type);

    // Update database
    console.log('[UploadProofAPI] Updating profile with payment proof');
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
          console.error('[UploadProofAPI] Failed to delete old payment proof:', error);
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
      );
    });

    revalidatePath('/payment');
    revalidatePath('/participant/dashboard');
    revalidatePath('/admin/payments');

    console.log('[UploadProofAPI] Payment proof upload completed successfully');
    return NextResponse.json({ success: true, url: fileUrl });
  } catch (error: any) {
    const { response, status } = createErrorResponse(error);
    return NextResponse.json(response, { status });
  }
}