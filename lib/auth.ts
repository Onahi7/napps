import { compare, hash } from 'bcrypt'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { generateParticipantReference } from '@/lib/utils/reference-generator';

const prisma = new PrismaClient()

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

export async function verifyCredentials(identifier: string, password: string, isEmailLogin: boolean = true) {
  const user = await prisma.user.findFirst({
    where: isEmailLogin ? { email: identifier } : { phone: identifier },
    include: {
      participant: true,
      validator: true,
      admin: true
    }
  })
  
  if (!user) return null
  
  // For non-admin regular users, skip password check
  if (!password) {
    return user
  }
  
  // For admin users, verify password
  const isValid = await compare(password, user.password)
  if (!isValid) return null
  
  return user
}

export async function getCurrentProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      participant: true,
      validator: true,
      admin: true
    }
  })
  return user
}

export async function isAdmin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })
  return user?.role === 'ADMIN'
}

export async function isValidator(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })
  return user?.role === 'VALIDATOR'
}

export async function requireRole(userId: string, requiredRole: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })
  if (!user || user.role !== requiredRole) {
    throw new Error('Unauthorized')
  }
}

