'use server'

import { query } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { revalidatePath } from 'next/cache'

export async function createScan(data: {
  userId: string
  scanType?: string
  location?: string
  notes?: string
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  const result = await query(
    `INSERT INTO scans (user_id, scanned_by, scan_type, location, notes, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING id`,
    [
      data.userId,
      session.user.id,
      data.scanType,
      data.location,
      data.notes
    ]
  )

  // Update user's accreditation status
  if (data.scanType === 'accreditation') {
    await query(
      `UPDATE profiles 
       SET accreditation_status = 'completed',
           accreditation_date = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [data.userId]
    )
  }

  // Update meal validation status
  if (['breakfast', 'dinner'].includes(data.scanType || '')) {
    await query(
      `INSERT INTO meal_validations (
        participant_id,
        validator_id,
        meal_type,
        date,
        status,
        validated_at,
        validator_name
      )
      SELECT 
        $1,
        $2,
        $3,
        CURRENT_DATE,
        'validated',
        NOW(),
        (SELECT full_name FROM profiles WHERE id = $2)
      WHERE NOT EXISTS (
        SELECT 1 FROM meal_validations 
        WHERE participant_id = $1 
        AND meal_type = $3 
        AND date = CURRENT_DATE
      )`,
      [data.userId, session.user.id, data.scanType]
    )
  }

  revalidatePath('/validator/scan')
  revalidatePath('/validator/history')
  return result.rows[0].id
}

export async function getScanHistory(limit: number = 50) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  const result = await query(
    `SELECT s.*, 
            p.full_name, p.email, p.phone,
            v.full_name as validator_name
     FROM scans s
     JOIN profiles p ON s.user_id = p.id
     JOIN profiles v ON s.scanned_by = v.id
     WHERE s.scanned_by = $1
     ORDER BY s.created_at DESC
     LIMIT $2`,
    [session.user.id, limit]
  )

  return result.rows
}

export async function getAllScans(limit: number = 50) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  const result = await query(
    `SELECT s.*, 
            p.full_name, p.email, p.phone,
            v.full_name as validator_name
     FROM scans s
     JOIN profiles p ON s.user_id = p.id
     JOIN profiles v ON s.scanned_by = v.id
     ORDER BY s.created_at DESC
     LIMIT $1`,
    [limit]
  )

  return result.rows
}

export async function getScansByValidator(validatorId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')
  
  const result = await query(
    `SELECT s.*, p.full_name, p.email, p.phone
     FROM scans s
     JOIN profiles p ON p.id = s.user_id
     WHERE s.scanned_by = $1
     ORDER BY s.created_at DESC`,
    [validatorId]
  )

  return result.rows
}

export async function getValidatorAssignments(validatorId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  // Get meal validation assignments based on validator schedule
  const assignments = await query(
    `SELECT 
      id,
      meal_type as type,
      location,
      schedule_date as date,
      schedule_time as time,
      status
     FROM validator_assignments
     WHERE validator_id = $1
     AND schedule_date >= CURRENT_DATE
     ORDER BY schedule_date ASC, schedule_time ASC`,
    [validatorId]
  )

  return assignments.rows.map(row => ({
    ...row,
    date: new Date(row.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }),
    time: row.time.replace(':00', '')
  }))
}

export async function getScanStats() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  const stats = await query(`
    SELECT
      COUNT(*) as total_scans,
      COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as today_scans,
      COUNT(CASE WHEN scan_type = 'breakfast' THEN 1 END) as breakfast_scans,
      COUNT(CASE WHEN scan_type = 'dinner' THEN 1 END) as dinner_scans,
      COUNT(CASE WHEN scan_type = 'accreditation' THEN 1 END) as accreditation_scans
    FROM scans
    WHERE scanned_by = $1`,
    [session.user.id]
  )

  return stats.rows[0]
}

