import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { withTransaction } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { CloudinaryService } from '@/lib/cloudinary-service';

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
    
    if (!file || !(file instanceof File)) {
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

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 5MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer for upload
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Upload to Cloudinary using our service
    const cloudinary = CloudinaryService.getInstance();
    const uploadResult = await cloudinary.uploadFile(buffer, {
      folder: 'payment-proofs',
      allowedFormats: ['jpg', 'jpeg', 'png', 'pdf']
    });

    // Update profile with new proof URL
    await withTransaction(async (client) => {
      // Get old proof if exists
      const result = await client.query(
        'SELECT payment_proof FROM profiles WHERE id = $1',
        [session.user.id]
      );

      // Delete old proof from Cloudinary if exists
      if (result.rows[0]?.payment_proof) {
        const oldUrl = result.rows[0].payment_proof;
        const oldPublicId = cloudinary.getPublicIdFromUrl(oldUrl);
        if (oldPublicId) {
          await cloudinary.deleteFile(oldPublicId);
        }
      }

      // Update profile with new proof
      await client.query(
        `UPDATE profiles 
         SET payment_proof = $1,
             payment_status = 'proof_submitted',
             updated_at = NOW()
         WHERE id = $2`,
        [uploadResult.secure_url, session.user.id]
      );
    });

    revalidatePath('/payment');
    revalidatePath('/participant/dashboard');
    revalidatePath('/admin/payments');

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url
    });
  } catch (error: any) {
    console.error('[UploadAPI] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}