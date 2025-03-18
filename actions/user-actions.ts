'use server'

import { query } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { hash } from 'bcrypt'
import { revalidatePath } from 'next/cache'

export async function createValidator(data: {
  email: string
  password: string
  full_name: string
  phone: string
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    // Validate email format
    if (!data.email || !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(data.email)) {
      throw new Error('Invalid email format')
    }

    // Validate phone format
    if (!data.phone || !/^\d{10,11}$/.test(data.phone)) {
      throw new Error('Phone number must be 10 or 11 digits')
    }

    // Validate required fields
    if (!data.full_name || data.full_name.trim().length < 3) {
      throw new Error('Full name is required and must be at least 3 characters')
    }

    if (!data.password || data.password.length < 8) {
      throw new Error('Password must be at least 8 characters')
    }

    // Hash password
    const hashedPassword = await hash(data.password, 10)

    return await query(
      `WITH new_user AS (
        INSERT INTO users (email, password_hash)
        VALUES ($1, $2)
        RETURNING id
      )
      INSERT INTO profiles (id, email, full_name, phone, role)
      SELECT id, $1, $3, $4, 'validator'
      FROM new_user
      RETURNING id`,
      [data.email, hashedPassword, data.full_name, data.phone]
    ).then(result => {
      revalidatePath('/admin/validators')
      return result.rows[0].id
    })
  } catch (error: any) {
    // Handle unique constraint violations
    if (error.code === '23505') {
      if (error.constraint === 'idx_profiles_email') {
        throw new Error('This email is already in use')
      }
      if (error.constraint === 'idx_profiles_phone') {
        throw new Error('This phone number is already in use')
      }
    }
    throw error
  }
}

export async function updateValidator(userId: string, data: {
  email?: string
  password?: string
  full_name?: string
  phone?: string
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    // Validate email format if provided
    if (data.email && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(data.email)) {
      throw new Error('Invalid email format')
    }

    // Validate phone format if provided
    if (data.phone && !/^\d{10,11}$/.test(data.phone)) {
      throw new Error('Phone number must be 10 or 11 digits')
    }

    // Validate name if provided
    if (data.full_name && data.full_name.trim().length < 3) {
      throw new Error('Full name must be at least 3 characters')
    }

    // Validate password if provided
    if (data.password && data.password.length < 8) {
      throw new Error('Password must be at least 8 characters')
    }

    // Start with profile updates
    const profileUpdates = []
    const values = []
    let paramCount = 1

    if (data.email) {
      profileUpdates.push(`email = $${paramCount}`)
      values.push(data.email)
      paramCount++
    }
    if (data.full_name) {
      profileUpdates.push(`full_name = $${paramCount}`)
      values.push(data.full_name)
      paramCount++
    }
    if (data.phone) {
      profileUpdates.push(`phone = $${paramCount}`)
      values.push(data.phone)
      paramCount++
    }

    if (profileUpdates.length > 0) {
      await query(
        `UPDATE profiles 
         SET ${profileUpdates.join(', ')}, updated_at = NOW()
         WHERE id = $${paramCount}`,
        [...values, userId]
      )
    }

    // Update password if provided
    if (data.password) {
      const hashedPassword = await hash(data.password, 10)
      await query(
        `UPDATE users 
         SET password_hash = $1, updated_at = NOW()
         WHERE id = $2`,
        [hashedPassword, userId]
      )
    }

    revalidatePath('/admin/validators')
    return { success: true }
  } catch (error: any) {
    // Handle unique constraint violations
    if (error.code === '23505') {
      if (error.constraint === 'idx_profiles_email') {
        throw new Error('This email is already in use')
      }
      if (error.constraint === 'idx_profiles_phone') {
        throw new Error('This phone number is already in use')
      }
    }
    throw error
  }
}

export async function deleteValidator(userId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  await query(
    'DELETE FROM users WHERE id = $1',
    [userId]
  )

  revalidatePath('/admin/validators')
  return { success: true }
}

export async function getValidators() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  const result = await query(
    `SELECT p.id, p.email, p.full_name, p.phone, p.created_at,
            COUNT(s.id) as total_scans,
            COUNT(CASE WHEN s.created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as today_scans
     FROM profiles p
     LEFT JOIN scans s ON s.scanned_by = p.id
     WHERE p.role = 'validator'
     GROUP BY p.id, p.email, p.full_name, p.phone, p.created_at
     ORDER BY p.created_at DESC`
  )

  return result.rows
}

export async function getValidatorStats() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  const stats = await query(`
    SELECT
      COUNT(*) as total_validators,
      COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_validators,
      (SELECT COUNT(DISTINCT scanned_by) 
       FROM scans 
       WHERE created_at >= NOW() - INTERVAL '24 hours') as active_validators
    FROM profiles
    WHERE role = 'validator'
  `)

  return stats.rows[0]
}

// Function to get users by role with optional filters
export async function getUsersByRole(role: string, options: { 
  limit?: number,
  offset?: number,
  status?: string,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc'
} = {}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  // Build query with filters
  let queryStr = `
    SELECT p.id, p.email, p.full_name, p.phone, p.created_at, p.payment_status,
           p.accreditation_status, p.state, p.lga, p.chapter, p.organization, p.position
    FROM profiles p
    WHERE p.role = $1
  `
  const queryParams = [role]
  let paramIndex = 2

  if (options.status) {
    queryStr += ` AND p.payment_status = $${paramIndex}`
    queryParams.push(options.status)
    paramIndex++
  }

  // Add sorting
  queryStr += ` ORDER BY ${options.sortBy || 'p.created_at'} ${options.sortOrder || 'desc'}`

  // Add pagination
  if (options.limit) {
    queryStr += ` LIMIT $${paramIndex}`
    queryParams.push(options.limit.toString())
    paramIndex++
  }

  if (options.offset) {
    queryStr += ` OFFSET $${paramIndex}`
    queryParams.push(options.offset.toString())
  }

  const result = await query(queryStr, queryParams)
  return result.rows
}

