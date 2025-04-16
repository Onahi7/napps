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
  const pathname = usePathname() || '/'
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    // Only update loading state when we have a definitive session status
    if (status !== 'loading') {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    // Only handle redirects when we have a definitive session status
    if (status === 'loading') return;

    const isAuthRoute = pathname === '/login' || pathname === '/register' || pathname === '/pre-register'
    // Add /registration-success to the list of public routes
    const isPublicRoute = pathname === '/' || pathname === '/privacy' || pathname === '/terms' || pathname === '/offline' || pathname === '/registration-success'

    if (status === 'unauthenticated') {
      // Only redirect if it's NOT an auth route AND NOT a public route
      if (!isAuthRoute && !isPublicRoute) {
        const callbackUrl = pathname ? encodeURIComponent(pathname) : ''
        router.push(`/login?callbackUrl=${callbackUrl}`)
      }
    } else if (status === 'authenticated' && session?.user) {
      // Handle redirects for authenticated users
      if (isAuthRoute) {
        // If on auth route, redirect to appropriate dashboard
        const dashboardPath = getDashboardPath(session.user.role)
        router.replace(dashboardPath)
      } else {
        // Validate current path against user role
        const currentPath = pathname.split('/')[1] // Get first segment
        const allowedPath = getAllowedPath(session.user.role, currentPath)
        
        if (allowedPath && allowedPath !== pathname) {
          router.replace(allowedPath)
        }
      }
    }
  }, [status, session, pathname, router])

  const signIn = async (phone: string) => {
    try {
      const result = await nextAuthSignIn("credentials", {
        identifier: phone,
        loginMethod: "phone",
        isAdmin: "false",
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

  const signOut = async () => {
    await nextAuthSignOut()
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

      return { success: true, error: null }
    } catch (error: any) {
      console.error("Registration error:", error)
      return { success: false, error: error.message }
    }
  }

  const value = {
    user: session?.user || null,
    profile: session?.user as Profile || null,
    loading,
    signIn,
    signOut,
    register
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Helper functions
function getDashboardPath(role: string): string {
  switch (role) {
    case 'ADMIN':
      return '/admin/dashboard'
    case 'VALIDATOR':
      return '/validator/dashboard'
    default:
      return '/participant/dashboard'
  }
}

function getAllowedPath(role: string, currentPath: string): string | null {
  // If trying to access specific role area
  if (currentPath === 'admin' && role !== 'ADMIN') {
    return getDashboardPath(role)
  }
  if (currentPath === 'validator' && role !== 'VALIDATOR') {
    return getDashboardPath(role)
  }
  if (currentPath === 'participant' && role !== 'PARTICIPANT') {
    return getDashboardPath(role)
  }
  return null
}

