import { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaClient } from '@prisma/client'
import { compare } from 'bcryptjs'

const prisma = new PrismaClient()

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        identifier: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" },
        loginMethod: { label: "Login Method", type: "text" },
        isAdmin: { label: "Is Admin", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.identifier) return null

        try {
          const isEmailLogin = credentials.loginMethod === "email"
          const where = isEmailLogin 
            ? { email: credentials.identifier }
            : { phone: credentials.identifier }

          // Find user with role-specific data
          const user = await prisma.user.findFirst({
            where,
            include: {
              participant: true,
              validator: true,
              admin: true
            }
          })

          if (!user) return null

          const baseUser = {
            id: user.id,
            email: user.email,
            name: user.fullName,
            full_name: user.fullName,
            role: user.role,
            phone: user.phone,
            position: user.participant?.position || '',
            state: user.participant?.state || '',
            lga: user.participant?.lga || '',
            chapter: user.participant?.chapter || '',
            organization: user.participant?.organization || '',
            payment_status: 'PENDING',
            accreditation_status: 'PENDING'
          }

          if (user.participant) {
            baseUser.payment_status = user.participant.paymentStatus
            baseUser.accreditation_status = user.participant.accreditationStatus
          }

          const isAdminLogin = credentials.isAdmin === 'true'

          // For regular participants, allow phone-only login
          if (!isAdminLogin && user.role === 'PARTICIPANT') {
            return baseUser
          }

          // For admin/validator/admin login attempts, require password
          if (isAdminLogin || user.role === 'ADMIN' || user.role === 'VALIDATOR') {
            if (!credentials.password) return null
            const isValid = await compare(credentials.password, user.password)
            if (!isValid) return null
          }

          return baseUser
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.phone = user.phone
        token.payment_status = user.payment_status
        token.accreditation_status = user.accreditation_status
        token.state = user.state
        token.lga = user.lga
        token.chapter = user.chapter
        token.organization = user.organization
        token.position = user.position
        token.full_name = user.full_name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.phone = token.phone as string
        session.user.payment_status = token.payment_status as string
        session.user.accreditation_status = token.accreditation_status as string
        session.user.state = token.state as string
        session.user.lga = token.lga as string
        session.user.chapter = token.chapter as string
        session.user.organization = token.organization as string
        session.user.position = token.position as string
        session.user.full_name = token.full_name as string
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  }
}

// Custom auth helpers
export async function isAdmin(userId: string) {
  const admin = await prisma.admin.findFirst({
    where: { userId }
  })
  return !!admin
}

export async function isValidator(userId: string) {
  const validator = await prisma.validator.findFirst({
    where: { userId }
  })
  return !!validator
}

export async function isParticipant(userId: string) {
  const participant = await prisma.participant.findFirst({
    where: { userId }
  })
  return !!participant
}

// Extend next-auth types
declare module "next-auth" {
  interface User {
    id: string
    role: string
    phone: string
    payment_status: string
    accreditation_status: string
  }

  interface Session {
    user: User & {
      id: string
      role: string
      phone: string
      payment_status: string
      accreditation_status: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    phone: string
    payment_status: string
    accreditation_status: string
  }
}

