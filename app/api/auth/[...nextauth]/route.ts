import NextAuth, { type NextAuthOptions, User } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { createClientServer } from "@/lib/supabase"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" },
        loginMethod: { label: "Login Method", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password || !credentials?.loginMethod) {
          return null
        }

        try {
          const supabase = await createClientServer()
          const isEmailLogin = credentials.loginMethod === "email"
          
          let authResult;
          
          if (isEmailLogin) {
            // Email-based login
            authResult = await supabase.auth.signInWithPassword({
              email: credentials.identifier,
              password: credentials.password,
            })
          } else {
            // Phone-based login - first find the user by phone number
            const { data: userByPhone } = await supabase
              .from("profiles")
              .select("email")
              .eq("phone", credentials.identifier)
              .single()
              
            if (!userByPhone?.email) {
              return null
            }

            // Then sign in with the email and phone as password
            authResult = await supabase.auth.signInWithPassword({
              email: userByPhone.email,
              password: credentials.password, // This should be the phone number
            })
          }

          const { data, error } = authResult
          
          if (error || !data.user) {
            console.error("Auth error:", error)
            return null
          }

          // Get user profile from profiles table
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .single()

          if (!profile) {
            return null
          }

          // Return user data in the format NextAuth expects
          return {
            id: data.user.id,
            email: profile.email,
            phone: profile.phone,
            full_name: profile.full_name,
            state: profile.school_state,
            school_name: profile.school_name,
            school_address: profile.school_address,
            school_city: profile.school_city,
            school_type: profile.school_type,
            napps_position: profile.napps_position,
            napps_chapter: profile.napps_chapter,
            role: profile.role,
            payment_status: profile.payment_status,
            // Add these properties to satisfy the TypeScript requirements
            lga: profile.lga || "",
            chapter: profile.napps_chapter || "",
            organization: profile.school_name || ""
          } as User
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = user
      }
      return token
    },
    async session({ session, token }) {
      session.user = token.user as any
      return session
    }
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt" as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
