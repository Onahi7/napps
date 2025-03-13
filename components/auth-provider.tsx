"use client"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react'

type Profile = {
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
  payment_status?: string
  accreditation_status?: string
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

type AuthContextType = {
  user: any
  profile: Profile | null
  loading: boolean
  signIn: (phone: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  register: (userData: {
    email: string
    password: string
    full_name: string
    phone: string
    state?: string
    lga?: string
    chapter?: string
    organization?: string
    position?: string
  }) => Promise<{ success: boolean; error: string | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    // Update loading state when session status changes
    if (status !== 'loading') {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    if (!loading) {
      const isAuthRoute = pathname === "/login" || pathname === "/register" || pathname === "/pre-register"
      if (!session && !isAuthRoute && pathname !== "/") {
        router.push("/login")
      } else if (session && isAuthRoute) {
        if (session.user.role === "admin") {
          router.push("/admin/dashboard")
        } else if (session.user.role === "validator") {
          router.push("/validator/dashboard")
        } else {
          router.push("/participant/dashboard")
        }
      }
    }
  }, [session, pathname, router, loading])

  const signIn = async (phone: string) => {
    try {
      const result = await nextAuthSignIn("credentials", {
        identifier: phone,
        loginMethod: "phone",
        redirect: false,
      })
      if (!result?.error) {
        return { error: null }
      }
      return { error: result.error }
    } catch (error) {
      return { error: "An error occurred during sign in" }
    }
  }

  const register = async (userData: {
    email: string
    password: string
    full_name: string
    phone: string
    state?: string
    lga?: string
    chapter?: string
    organization?: string
    position?: string
  }) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // Auto login after successful registration
      const result = await nextAuthSignIn("credentials", {
        identifier: userData.email,
        loginMethod: "email",
        redirect: false,
      })

      if (result?.error) {
        throw new Error('Auto login after registration failed')
      }

      return { success: true, error: null }
    } catch (error: any) {
      console.error("Registration error:", error)
      return { success: false, error: error.message }
    }
  }

  const signOut = async () => {
    await nextAuthSignOut({ callbackUrl: "/login" })
  }

  const value = {
    user: session?.user || null,
    profile: session?.user as Profile || null,
    loading,
    signIn,
    signOut,
    register,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

