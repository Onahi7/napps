'use server'

import { query } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export interface AccreditationStatus {
  status: "not_registered" | "pending_payment" | "pending_accreditation" | "accredited";
  accreditation_date?: string;
  accreditation_time?: string;
  validator?: string;
  location?: string;
  badge_collected?: boolean;
  badge_collection_time?: string;
  materials_collected?: boolean;
  materials_collection_time?: string;
}

export async function getAccreditationStatus(): Promise<AccreditationStatus | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const result = await query(`
    SELECT 
      p.payment_status,
      a.status as accreditation_status,
      a.accreditation_date,
      a.accreditation_time,
      a.validator,
      a.location,
      a.badge_collected,
      a.badge_collection_time,
      a.materials_collected,
      a.materials_collection_time
    FROM profiles p
    LEFT JOIN accreditations a ON p.id = a.user_id
    WHERE p.id = $1
  `, [session.user.id])

  if (!result.rows[0]) return null

  const row = result.rows[0]
  
  // Determine status based on payment and accreditation
  let status: AccreditationStatus['status']
  if (!row.payment_status) {
    status = 'not_registered'
  } else if (row.payment_status !== 'completed') {
    status = 'pending_payment'
  } else if (!row.accreditation_status) {
    status = 'pending_accreditation'
  } else {
    status = 'accredited'
  }

  return {
    status,
    accreditation_date: row.accreditation_date,
    accreditation_time: row.accreditation_time,
    validator: row.validator,
    location: row.location,
    badge_collected: row.badge_collected,
    badge_collection_time: row.badge_collection_time,
    materials_collected: row.materials_collected,
    materials_collection_time: row.materials_collection_time
  }
}