'use server'

import { query } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { revalidatePath } from 'next/cache'

export async function getAllAssignments() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  const result = await query(
    `SELECT a.*, p.full_name as validator_name
     FROM validator_assignments a
     JOIN profiles p ON p.id = a.validator_id
     WHERE a.deleted_at IS NULL
     ORDER BY a.schedule_date ASC, a.schedule_time ASC`,
  )

  return result.rows.map(row => ({
    ...row,
    schedule_date: new Date(row.schedule_date).toISOString()
  }))
}

export async function createValidatorAssignment(data: {
  validatorId: string
  mealType: string
  location: string
  scheduleDate: Date
  scheduleTime: string
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  await query(
    `INSERT INTO validator_assignments (
      validator_id,
      meal_type,
      location,
      schedule_date,
      schedule_time,
      status,
      created_at,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, 'pending', NOW(), NOW())`,
    [
      data.validatorId,
      data.mealType,
      data.location,
      data.scheduleDate,
      data.scheduleTime
    ]
  )

  revalidatePath('/admin/assignments')
  return { success: true }
}

export async function updateAssignmentStatus(assignmentId: string, status: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  await query(
    `UPDATE validator_assignments
     SET status = $1, updated_at = NOW()
     WHERE id = $2`,
    [status, assignmentId]
  )

  revalidatePath('/admin/assignments')
  revalidatePath('/validator/dashboard')
  return { success: true }
}

export async function deleteValidatorAssignment(assignmentId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  // Soft delete the assignment
  await query(
    `UPDATE validator_assignments
     SET deleted_at = NOW(), updated_at = NOW()
     WHERE id = $1`,
    [assignmentId]
  )

  revalidatePath('/admin/assignments')
  revalidatePath('/validator/dashboard')
  return { success: true }
}