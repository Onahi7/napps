import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { env } from '@/lib/env';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  endpoint: `https://${env.DO_SPACES_REGION}.digitaloceanspaces.com`,
  region: env.DO_SPACES_REGION,
  credentials: {
    accessKeyId: env.DO_SPACES_KEY,
    secretAccessKey: env.DO_SPACES_SECRET
  }
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileType } = await request.json();
    
    if (!['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'].includes(fileType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image (JPG/PNG) or PDF' },
        { status: 400 }
      );
    }

    const fileName = `payment-proofs/${session.user.id}-${uuidv4()}.${fileType.split('/')[1]}`;
    const command = new PutObjectCommand({
      Bucket: env.DO_SPACES_BUCKET,
      Key: fileName,
      ContentType: fileType,
      ACL: 'public-read'
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 }); // URL expires in 10 minutes
    const fileUrl = `https://${env.DO_SPACES_BUCKET}.${env.DO_SPACES_REGION}.cdn.digitaloceanspaces.com/${fileName}`;

    return NextResponse.json({
      presignedUrl,
      fileUrl
    });
  } catch (error) {
    console.error('Presigned URL generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}