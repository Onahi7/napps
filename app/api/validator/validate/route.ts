import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { withTransaction } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { createScan } from '@/actions/scan-actions';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'validator') {
      return NextResponse.json(
        { error: 'Unauthorized: Validator access required' },
        { status: 403 }
      );
    }

    const { participantId, phone, validationType, location } = await request.json();

    if (!participantId && !phone) {
      return NextResponse.json(
        { error: 'Either participant ID or phone number is required' },
        { status: 400 }
      );
    }

    return await withTransaction(async (client) => {
      // Get participant details
      const result = await client.query(
        `SELECT id, full_name, phone, school_name as school, accreditation_status
         FROM profiles 
         WHERE ${participantId ? 'id = $1' : 'phone = $1'}
         AND role = 'participant'`,
        [participantId || phone]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'Participant not found'
        }, { status: 404 });
      }

      const participant = result.rows[0];

      // Check if already validated for accreditation
      if (participant.accreditation_status === 'completed') {
        return NextResponse.json({
          success: false,
          message: 'Participant has already been accredited',
          participant: {
            full_name: participant.full_name,
            phone: participant.phone,
            school: participant.school
          }
        });
      }

      // Create validation record
      const scan = await createScan({
        participantId: participant.id,
        validatorId: session.user.id,
        type: 'CHECK_IN',
        notes: `${validationType} validation by ${session.user.name}`
      });

      // All validation paths revalidated by createScan action
      return NextResponse.json({
        success: true,
        message: 'Validation successful',
        participant: {
          full_name: participant.full_name,
          phone: participant.phone,
          school: participant.school
        },
        scanId: scan.id
      });
    });
  } catch (error: any) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to validate participant' 
      },
      { status: 500 }
    );
  }
}