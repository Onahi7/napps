import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { verifyCredentials } from './auth'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt'
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        identifier: { label: "Email/Phone", type: "text" },
        password: { label: "Password", type: "password" },
        loginMethod: { label: "Login Method", type: "text" },
        isAdmin: { label: "Is Admin", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.loginMethod) {
          throw new Error('Missing credentials')
        }

        const isEmailLogin = credentials.loginMethod === 'email'
        const profile = await verifyCredentials(
          credentials.identifier,
          credentials.password || '',
          isEmailLogin
        )

        if (!profile) return null

        return {
          id: profile.id,
          role: profile.role,
          phone: profile.phone,
          payment_status: profile.payment_status,
          accreditation_status: profile.accreditation_status,
          state: profile.state || '',
          lga: profile.lga || '',
          chapter: profile.chapter || '',
          organization: profile.organization || '',
          position: profile.position || '',
          full_name: profile.full_name,
          email: profile.email,
          image: profile.avatar_url
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
    error: '/login'
  },
  callbacks: {
    jwt: async ({ token, user }) => {
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
    session: async ({ session, token }) => {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.phone = token.phone
        session.user.payment_status = token.payment_status
        session.user.accreditation_status = token.accreditation_status
        session.user.state = token.state
        session.user.lga = token.lga
        session.user.chapter = token.chapter
        session.user.organization = token.organization
        session.user.position = token.position
        session.user.full_name = token.full_name
      }
      return session
    }
  }
}

