import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { isAdmin } from '@/lib/auth'
import { query, withTransaction } from '@/lib/db'
import { revalidatePath } from 'next/cache'

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

    const result = await query('SELECT * FROM config')
    const settings = result.rows.reduce((acc: any, row) => {
      try {
        acc[row.key] = JSON.parse(row.value)
      } catch {
        acc[row.key] = row.value
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

    await withTransaction(async (client) => {
      // Update conference settings
      await client.query(
        `INSERT INTO config (key, value)
         VALUES ('conference', $1)
         ON CONFLICT (key) DO UPDATE SET value = $1`,
        [JSON.stringify(conference)]
      )

      // Update system settings
      await client.query(
        `INSERT INTO config (key, value)
         VALUES ('system', $1)
         ON CONFLICT (key) DO UPDATE SET value = $1`,
        [JSON.stringify(system)]
      )
    })

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