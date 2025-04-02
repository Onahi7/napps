import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { isAdmin } from '@/lib/auth'
import { setMaintenanceMode } from '@/actions/config-actions'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await isAdmin(session.user.id)
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { enabled } = await req.json()
    
    const result = await setMaintenanceMode(enabled)
    
    if (result) {
      return NextResponse.json({
        status: 'success',
        message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'} successfully`
      })
    } else {
      return NextResponse.json({
        status: 'error',
        message: 'Failed to update maintenance mode'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Maintenance mode update error:', error)
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}