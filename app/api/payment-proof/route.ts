import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { query, withTransaction } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileUrl } = await request.json();
    if (!fileUrl) {
      return NextResponse.json({ error: 'File URL is required' }, { status: 400 });
    }

    await withTransaction(async (client) => {
      // Get current payment proof if any
      const result = await client.query(
        'SELECT payment_proof FROM profiles WHERE id = $1',
        [session.user.id]
      );

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

    revalidatePath('/payment');
    revalidatePath('/participant/dashboard');
    revalidatePath('/admin/payments');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Payment proof update error:', error);
    return NextResponse.json(
      { error: 'Failed to update payment proof' },
      { status: 500 }
    );
  }
}