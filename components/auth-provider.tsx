"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react'
import { createClientBrowser } from "@/lib/supabase"
import type { Database } from "@/lib/database.types"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

type AuthContextType = {
  user: any
  profile: Profile | null
  loading: boolean
  signIn: (phone: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
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
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const supabase = createClientBrowser()

  useEffect(() => {
    const fetchProfile = async () => {
      if (session?.user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()
        setProfile(data || null)
      }
      setLoading(false)
    }

    fetchProfile()
  }, [session, supabase])

  useEffect(() => {
    if (!loading) {
      const isAuthRoute = pathname === "/login" || pathname === "/register" || pathname === "/pre-register"

      if (!session && !isAuthRoute && pathname !== "/") {
        router.push("/login")
      } else if (session && isAuthRoute) {
        if (profile?.role === "admin") {
          router.push("/admin/dashboard")
        } else if (profile?.role === "validator") {
          router.push("/validator/dashboard")
        } else {
          router.push("/participant/dashboard")
        }
      }
    }
  }, [session, profile, pathname, router, loading])

  const signIn = async (phone: string) => {
    try {
      const result = await nextAuthSignIn("credentials", {
        phone,
        callbackUrl: "/dashboard",
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
    await nextAuthSignOut({ callbackUrl: "/login" })
  }

  const value = {
    user: session?.user || null,
    profile,
    loading: status === "loading",
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

