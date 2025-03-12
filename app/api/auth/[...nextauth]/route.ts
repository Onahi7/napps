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
        loginMethod: { label: "Login Method", type: "text" },
        isAdmin: { label: "Is Admin", type: "boolean" }
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.loginMethod) {
          return null
        }
        
        try {
          const supabase = await createClientServer()
          const isEmailLogin = credentials.loginMethod === "email"
          const isAdminLogin = credentials.isAdmin === 'true'
          
          // For admin login, always require password
          if (isAdminLogin && !credentials.password) {
            return null
          }
          
          let email: string | null = null;
          
          // Find the user by email or phone
          if (isEmailLogin) {
            email = credentials.identifier
          } else {
            // Find user by phone number
            const { data: userByPhone } = await supabase
              .from("profiles")
              .select("email")
              .eq("phone", credentials.identifier)
              .single()
              
            if (!userByPhone?.email) {
              return null
            }
            email = userByPhone.email
          }
          
          if (!email) return null
          
          // Get user profile to check role
          const { data: profileCheck } = await supabase
            .from("profiles")
            .select("role")
            .eq("email", email)
            .single()
            
          // For admin user, require password authentication
          if (profileCheck?.role === 'admin') {
            if (!credentials.password) {
              return null
            }
            
            // Admin authentication with password
            const { data, error } = await supabase.auth.signInWithPassword({
              email: email,
              password: credentials.password,
            })
            
            if (error || !data.user) {
              console.error("Admin auth error:", error)
              return null
            }
            
            // Get full profile
            const { data: profile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", data.user.id)
              .single()
              
            if (!profile) return null
            
            return createUserObject(data.user.id, profile)
          } 
          // For regular users - passwordless login
          else {
            // Get user by email for regular user
            const { data: userByEmail } = await supabase
              .from("profiles")
              .select("*")
              .eq("email", email)
              .single()
              
            if (!userByEmail) {
              return null
            }
            
            // Get auth user id
            const { data: authUser } = await supabase
              .from("users")
              .select("id")
              .eq("email", email)
              .single()
              
            if (!authUser?.id) {
              return null
            }
            
            return createUserObject(authUser.id, userByEmail)
          }
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

// Helper function to create a consistent user object
function createUserObject(id: string, profile: any): User {
  return {
    id: id,
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
    lga: profile.lga || "",
    chapter: profile.napps_chapter || "",
    organization: profile.school_name || ""
  } as User
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
