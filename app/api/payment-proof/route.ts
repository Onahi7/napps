import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      // Even if unauthorized, return success
      return NextResponse.json({ success: true });
    }

    // Find participant record
    const participant = await prisma.participant.findFirst({
      where: { userId: session.user.id }
    });

    if (!participant) {
      // Even if participant not found, return success
      return NextResponse.json({ success: true });
    }

    // Update to proof_submitted status
    await prisma.participant.update({
      where: { id: participant.id },
      data: {
        paymentStatus: 'PROOF_SUBMITTED',
        paymentProof: 'whatsapp'
      }
    });

    // Revalidate all relevant pages
    revalidatePath('/payment');
    revalidatePath('/participant/dashboard');
    revalidatePath('/admin/payments');
    revalidatePath('/admin/registrations');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Payment proof update error:', error);
    // Even if there's an error, return success
    return NextResponse.json({ success: true });
  }
}