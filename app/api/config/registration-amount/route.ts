import { NextRequest, NextResponse } from 'next/server'
import { getRegistrationAmount } from '@/lib/config-service'

export async function GET(request: NextRequest) {
  try {
    const amount = await getRegistrationAmount()
    return NextResponse.json({ amount })
  } catch (error: any) {
    console.error('Error fetching registration amount:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch registration amount' },
      { status: 500 }
    )
  }
}