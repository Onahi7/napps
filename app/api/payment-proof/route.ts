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

    const { userPhone } = await request.json();
    if (!userPhone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    await withTransaction(async (client) => {
      await client.query(
        `UPDATE profiles 
         SET payment_status = 'proof_submitted',
             payment_proof = 'whatsapp',
             updated_at = NOW()
         WHERE id = $1`,
        [session.user.id]
      );
    });

    revalidatePath('/payment');
    revalidatePath('/participant/dashboard');
    revalidatePath('/admin/payments');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Payment proof update error:', error);
    return NextResponse.json(
      { error: 'Failed to update payment status' },
      { status: 500 }
    );
  }
}