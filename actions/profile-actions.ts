'use server'
import { query } from '@/lib/db'
import { getCurrentProfile } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { revalidatePath } from 'next/cache'

export async function updateUserProfile(data: {
  full_name?: string
  email?: string
  phone?: string
  state?: string
  lga?: string
  chapter?: string
  organization?: string
  position?: string
  bio?: string
  dietary_requirements?: string
  school_name?: string
  school_address?: string
  school_city?: string
  school_state?: string
  school_type?: string
  napps_position?: string
  napps_chapter?: string
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    // Validate email format
    if (data.email && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(data.email)) {
      return { success: false, error: 'Invalid email format' }
    }

    // Validate phone format
    if (data.phone && !/^\d{10,11}$/.test(data.phone)) {
      return { success: false, error: 'Phone number must be 10 or 11 digits' }
    }

    // Validate required fields
    if (!data.full_name) {
      return { success: false, error: 'Full name is required' }
    }

    const fields = Object.keys(data)
    const values = Object.values(data)
    const setClause = fields.map((field, i) => `${field} = $${i + 2}`).join(', ')

    await query(
      `UPDATE profiles 
       SET ${setClause}, updated_at = NOW()
       WHERE id = $1`,
      [session.user.id, ...values]
    )

    revalidatePath('/participant/profile')
    return { success: true }
  } catch (error: any) {
    console.error('Error updating profile:', error)
    // Check for unique constraint violations
    if (error.code === '23505') {
      if (error.constraint === 'idx_profiles_email') {
        return { success: false, error: 'This email is already in use' }
      }
      if (error.constraint === 'idx_profiles_phone') {
        return { success: false, error: 'This phone number is already in use' }
      }
    }
    return { success: false, error: error.message }
  }
}

export async function getMyProfile() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  
  return getCurrentProfile(session.user.id)
}

export async function searchProfiles(searchQuery: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  const result = await query(
    `SELECT id, full_name, email, phone, role, payment_status, accreditation_status
     FROM profiles
     WHERE full_name ILIKE $1 
        OR email ILIKE $1 
        OR phone ILIKE $1
     ORDER BY full_name
     LIMIT 20`,
    [`%${searchQuery}%`]
  )

  return result.rows
}

export async function getProfileStats() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  const stats = await query(`
    SELECT
      COUNT(*) as total_profiles,
      COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as paid_profiles,
      COUNT(CASE WHEN accreditation_status = 'completed' THEN 1 END) as accredited_profiles,
      COUNT(CASE WHEN role = 'participant' THEN 1 END) as total_participants,
      COUNT(CASE WHEN role = 'validator' THEN 1 END) as total_validators
    FROM profiles
  `)

  return stats.rows[0]
}

// Adding new updateProfile function that's an alias to updateUserProfile for compatibility
export const updateProfile = updateUserProfile;

export async function getParticipantStatus(userId: string | undefined) {
  if (!userId) return null

  const result = await query(
    `SELECT 
      payment_status,
      accreditation_status,
      accommodation_status
     FROM profiles 
     WHERE id = $1`,
    [userId]
  )

  return {
    payment: result.rows[0]?.payment_status || 'pending',
    accreditation: result.rows[0]?.accreditation_status || 'pending',
    accommodation: result.rows[0]?.accommodation_status || 'not_booked'
  }
}

export async function getMealValidations(userId: string) {
  const result = await query(
    `SELECT 
      date,
      meal_type,
      status,
      validated_at,
      validator_name
     FROM meal_validations 
     WHERE participant_id = $1
     ORDER BY date ASC`,
    [userId]
  )

  // Transform the flat data into the structured format needed by the UI
  const mealData: { [key: string]: any } = {}
  
  result.rows.forEach(row => {
    const date = new Date(row.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
    
    if (!mealData[date]) {
      mealData[date] = {
        breakfast: { status: 'pending' },
        dinner: { status: 'pending' }
      }
    }

    if (row.status === 'validated') {
      mealData[date][row.meal_type] = {
        status: 'validated',
        time: new Date(row.validated_at).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: 'numeric'
        }),
        validator: row.validator_name
      }
    } else if (row.status === 'expired') {
      mealData[date][row.meal_type] = {
        status: 'expired'
      }
    }
  })

  return mealData
}

export async function getNotifications() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return []

  const result = await query(
    `SELECT 
      id,
      message,
      created_at as time,
      read
     FROM notifications 
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 5`,
    [session.user.id]
  )

  return result.rows.map(row => ({
    ...row,
    time: new Date(row.time).toISOString()
  }))
}