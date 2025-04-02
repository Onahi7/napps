import { NextRequest, NextResponse } from 'next/server'
import { getSystemConfig } from '@/actions/config-actions'

export async function GET(req: NextRequest) {
  try {
    const config = await getSystemConfig()
    
    if (config.maintenanceMode) {
      return new Response('System is temporarily undergoing maintenance. Please try again in a few minutes.', {
        status: 503,
        headers: {
          'Content-Type': 'text/plain',
          'Retry-After': '300' // 5 minutes
        }
      })
    }
    
    return NextResponse.next()
  } catch (error) {
    console.error('Maintenance check error:', error)
    return NextResponse.next()
  }
}