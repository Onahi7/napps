import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { isAdmin } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

interface ConferenceConfig {
  name: string;
  date: string;
  venue: string;
  theme: string;
  registrationOpen: boolean;
  maxParticipants: number;
  registrationFee: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  contactEmail: string;
  description: string;
}

interface SystemConfig {
  maintenanceMode: boolean;
  debugMode: boolean;
  analyticsEnabled: boolean;
  fileUploadLimit: number;
  defaultResourceVisibility: "public" | "private";
  resourceCategories: string[];
  emailNotifications: boolean;
  timezone: string;
}

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

    const configs = await prisma.config.findMany()
    const settings = configs.reduce((acc: any, config) => {
      try {
        acc[config.key] = typeof config.value === 'string' ? 
          JSON.parse(config.value as string) : 
          config.value
      } catch {
        acc[config.key] = config.value
      }
      return acc
    }, {})

    return NextResponse.json(settings)
  } catch (error: any) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const { conference, system } = await request.json()

    // Use Prisma transaction to update both configs
    await prisma.$transaction([
      prisma.config.upsert({
        where: { key: 'conference' },
        update: { value: JSON.stringify(conference) },
        create: {
          key: 'conference',
          value: JSON.stringify(conference)
        }
      }),
      prisma.config.upsert({
        where: { key: 'system' },
        update: { value: JSON.stringify(system) },
        create: {
          key: 'system',
          value: JSON.stringify(system)
        }
      })
    ])

    // Revalidate all pages that might use these settings
    revalidatePath('/admin/settings')
    revalidatePath('/admin/resources')
    revalidatePath('/participant/resources')
    revalidatePath('/')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}