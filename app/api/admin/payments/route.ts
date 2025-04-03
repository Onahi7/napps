import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { isAdmin } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET endpoint to retrieve all payment submissions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if the user is an admin
    const admin = await isAdmin(session.user.id);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    // Get all payment submissions with a focus on those with proof submitted
    const payments = await prisma.participant.findMany({
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: [
        {
          paymentStatus: 'asc'
        },
        {
          paymentDate: 'desc'
        }
      ]
    });

    // Transform to match expected format
    const formattedPayments = payments.map(p => ({
      id: p.id,
      full_name: p.user.fullName,
      email: p.user.email,
      phone: p.user.phone,
      payment_status: p.paymentStatus,
      payment_amount: p.paymentAmount,
      payment_proof: p.paymentProof,
      created_at: p.paymentDate
    }));

    return NextResponse.json(formattedPayments);
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}