import { NextResponse } from 'next/server'
import { getConferenceDetails } from '@/lib/config-service'

export async function GET() {
  try {
    const details = await getConferenceDetails()
    
    return NextResponse.json({
      bankName: details.bankName,
      accountNumber: details.accountNumber,
      accountName: details.accountName,
    })
  } catch (error) {
    console.error('Error fetching bank details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bank details' },
      { status: 500 }
    )
  }
}