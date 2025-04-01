import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { isAdmin } from '@/lib/auth';
import { query } from '@/lib/db';

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
    const result = await query(`
      SELECT 
        p.id, 
        p.full_name, 
        p.email, 
        p.phone, 
        p.payment_status, 
        p.payment_amount, 
        p.payment_proof, 
        p.created_at
      FROM profiles p
      ORDER BY 
        CASE 
          WHEN p.payment_status = 'proof_submitted' THEN 1
          WHEN p.payment_status = 'completed' THEN 2
          ELSE 3 
        END,
        p.created_at DESC
    `);

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}