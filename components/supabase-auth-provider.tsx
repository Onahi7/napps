"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { createClientBrowser } from "@/lib/supabase"
import type { Database } from "@/lib/database.types"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

type AuthContextType = {
  user: User | null
  profile: Profile | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string) => Promise<{ error: any; data: any }>
  signUp: (userData: any) => Promise<{ error: any; data: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  signIn: async () => ({ error: null, data: null }),
  signUp: async () => ({ error: null, data: null }),
  signOut: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientBrowser()

  useEffect(() => {
    // Skip during prerendering
    if (typeof window === "undefined") {
      setIsLoading(false)
      return
    }

    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          // Fetch user profile
          const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()
          setProfile(data || null)
        }
      } catch (error) {
        console.error("Error getting session:", error)
      } finally {
        setIsLoading(false)
      }
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: string, session: Session | null) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        // Fetch user profile
        const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()
        setProfile(data || null)
      } else {
        setProfile(null)
      }

      setIsLoading(false)
      router.refresh()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  // Sign in with email and password
  const signIn = async (email: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: `napps-${email}`, // Use email for password instead of phone
    })

    if (!error) {
      router.refresh()
    }

    return { data, error }
  }

  // Sign up (create profile after registration)
  const signUp = async (userData: any) => {
    // Create auth user
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: `napps-${userData.email}`, // Use email for password instead of phone
    })

    if (error) {
      return { data: null, error }
    }

    // Create the profile
    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        email: userData.email, // Save the email in the database
        phone: userData.phone,
        full_name: userData.full_name,
        state: userData.state,
        lga: userData.lga,
        chapter: userData.chapter,
        position: userData.position,
        organization: userData.organization,
        role: "participant",
      })

      if (profileError) {
        return { data: null, error: profileError }
      }
    }

    router.refresh()
    return { data, error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const value = {
    user,
    profile,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

