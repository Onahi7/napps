import { NextResponse } from 'next/server'
import { getServerConfig } from '@/lib/config-service'

export async function GET() {
  try {
    const [bankName, accountNumber, accountName] = await Promise.all([
      getServerConfig<string>("bankName", ""),
      getServerConfig<string>("accountNumber", ""),
      getServerConfig<string>("accountName", "")
    ])
    
    return NextResponse.json({
      bankName,
      accountNumber,
      accountName,
    })
  } catch (error) {
    console.error('Error fetching bank details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bank details' },
      { status: 500 }
    )
  }
}