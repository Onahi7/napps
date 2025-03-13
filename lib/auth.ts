'use server'

import { query } from './db'
import { compare, hash } from 'bcrypt'

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
}

export async function createUser(userData: {
  email: string
  password: string
  full_name: string
  phone: string
}) {
  const hashedPassword = await hash(userData.password, 10)
  return await query(
    `INSERT INTO users (email, password_hash, created_at, updated_at)
     VALUES ($1, $2, NOW(), NOW())
     RETURNING id`,
    [userData.email, hashedPassword]
  ).then(async (result) => {
    const userId = result.rows[0].id
    await query(
      `INSERT INTO profiles (id, email, full_name, phone, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'participant', NOW(), NOW())`,
      [userId, userData.email, userData.full_name, userData.phone]
    )
    return userId
  })
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

