import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { createScan } from '@/actions/scan-actions';

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'VALIDATOR') {
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

    // Use transaction for data consistency
    return await prisma.$transaction(async (tx) => {
      // Get participant details
      const participant = await tx.participant.findFirst({
        where: phone 
          ? { user: { phone } }
          : { id: participantId },
        include: {
          user: true
        }
      });

      if (!participant) {
        return NextResponse.json({
          success: false,
          message: 'Participant not found'
        }, { status: 404 });
      }

      // Check if already validated for accreditation
      if (participant.accreditationStatus === 'COMPLETED') {
        return NextResponse.json({
          success: false,
          message: 'Participant has already been accredited',
          participant: {
            fullName: participant.user.fullName,
            phone: participant.user.phone,
            organization: participant.organization
          }
        });
      }

      // Create scan record
      const scan = await tx.scan.create({
        data: {
          type: validationType,
          location,
          participantId: participant.id,
          validatorId: session.user.id,
          notes: `${validationType} validation by ${session.user.name}`
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Validation successful',
        participant: {
          fullName: participant.user.fullName,
          phone: participant.user.phone,
          organization: participant.organization
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