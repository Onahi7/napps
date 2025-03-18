'use server'

import { query } from './db'
import { compare, hash } from 'bcrypt'
import { z } from 'zod'
import { generateParticipantReference } from '@/lib/utils/reference-generator';

export interface Profile {
  id: string
  email: string
  full_name: string
  phone: string
  role: string
  state?: string
  lga?: string
  chapter?: string
  organization?: string
  position?: string
  payment_status: string
  accreditation_status: string
  bio?: string
  dietary_requirements?: string
  school_name?: string
  school_address?: string
  school_city?: string
  school_state?: string
  school_type?: string
  napps_position?: string
  napps_chapter?: string
}

const registrationSchema = z.object({
  email: z.string()
    .email("Please enter a valid email address"),
  password: z.string(),
  full_name: z.string()
    .min(1, "Full name is required"),
  phone: z.string()
    .min(1, "Phone number is required"),
  state: z.string().optional(),
  lga: z.string().optional(),
  chapter: z.string().optional(),
  organization: z.string().optional(),
  position: z.string().optional(),
  school_name: z.string()
    .min(1, "School name is required"),
  school_address: z.string(),
  school_state: z.string()
    .min(1, "School state is required"),
  napps_chapter: z.string()
    .min(1, "NAPPS chapter is required")
})

export async function createUser(userData: z.infer<typeof registrationSchema>) {
  try {
    // Validate input data
    const validatedData = registrationSchema.parse(userData)

    // Hash password
    const hashedPassword = await hash(validatedData.password, 10)
    
    try {
      // Insert user
      const result = await query(
        `INSERT INTO users (email, password_hash, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())
         RETURNING id`,
        [validatedData.email, hashedPassword]
      )

      const userId = result.rows[0].id
      const referenceCode = generateParticipantReference();

      // Insert profile with reference
      await query(
        `INSERT INTO profiles (
          id, email, full_name, phone, role, reference_code,
          school_name, school_address, school_state, napps_chapter,
          created_at, updated_at
        )
        VALUES (
          $1, $2, $3, $4, 'participant', $5, 
          $6, $7, $8, $9,
          NOW(), NOW()
        )`,
        [
          userId, 
          validatedData.email, 
          validatedData.full_name, 
          validatedData.phone,
          referenceCode,
          validatedData.school_name,
          validatedData.school_address,
          validatedData.school_state,
          validatedData.napps_chapter
        ]
      )

      return userId
    } catch (error: any) {
      if (error.message.includes('idx_profiles_email')) {
        throw new Error('This email is already registered')
      }
      if (error.message.includes('idx_profiles_phone')) {
        throw new Error('This phone number is already registered')
      }
      throw error
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0].message)
    }
    throw error
  }
}

export async function verifyCredentials(identifier: string, password: string, isEmailLogin: boolean = true) {
  const result = await query(
    `SELECT u.id, u.password_hash, p.*
     FROM users u
     JOIN profiles p ON p.id = u.id
     WHERE ${isEmailLogin ? 'u.email = $1' : 'p.phone = $1'}`,
    [identifier]
  )
  
  if (!result.rows[0]) return null
  
  // For non-admin regular users, skip password check
  if (!password) {
    return result.rows[0]
  }
  
  // For admin users, verify password
  const isValid = await compare(password, result.rows[0].password_hash)
  if (!isValid) return null
  
  return result.rows[0]
}

export async function getCurrentProfile(userId: string): Promise<Profile | null> {
  const result = await query(
    `SELECT id, email, full_name, phone, role, state, lga, chapter, 
            organization, position, payment_status, accreditation_status
     FROM profiles
     WHERE id = $1`,
    [userId]
  )
  return result.rows[0] || null
}

export async function isAdmin(userId: string) {
  const result = await query(
    'SELECT role FROM profiles WHERE id = $1',
    [userId]
  )
  return result.rows[0]?.role === 'admin'
}

export async function isValidator(userId: string) {
  const result = await query(
    'SELECT role FROM profiles WHERE id = $1',
    [userId]
  )
  return result.rows[0]?.role === 'validator'
}

export async function requireRole(userId: string, requiredRole: string) {
  const result = await query(
    'SELECT role FROM profiles WHERE id = $1',
    [userId]
  )
  if (!result.rows[0] || result.rows[0].role !== requiredRole) {
    throw new Error('Unauthorized')
  }
}

