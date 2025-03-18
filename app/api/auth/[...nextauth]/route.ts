import NextAuth from 'next-auth'
import { type NextAuthOptions } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

const handler = NextAuth(authOptions as NextAuthOptions)
export { handler as GET, handler as POST }
