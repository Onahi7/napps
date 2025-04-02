import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { isAdmin } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify admin access
    const admin = await isAdmin(session.user.id)
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    // Fetch all registrations with related data
    const registrations = await prisma.participant.findMany({
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        user: {
          createdAt: 'desc'
        }
      }
    })

    // Transform data to match expected format
    const formattedRegistrations = registrations.map(registration => ({
      id: registration.id,
      full_name: registration.user.fullName,
      email: registration.user.email,
      phone: registration.user.phone,
      organization: registration.organization,
      state: registration.state,
      chapter: registration.chapter,
      payment_status: registration.paymentStatus,
      accreditation_status: registration.accreditationStatus,
      created_at: registration.user.createdAt
    }))

    return NextResponse.json(formattedRegistrations)
  } catch (error: any) {
    console.error('Error fetching registrations:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch registrations' },
      { status: 500 }
    )
  }
}