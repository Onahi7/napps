"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { createClientBrowser } from "@/lib/supabase"

export function useAuth() {
  const { data: session, status } = useSession()
  const isLoading = status === "loading"
  const isAuthenticated = status === "authenticated"

  // Custom sign-in function that uses NextAuth
  const login = async (email: string, password: string) => {
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        return { success: false, error: result.error }
      }

      return { success: true, error: null }
    } catch (error: any) {
      console.error("Login error:", error)
      return { success: false, error: error.message || "Login failed" }
    }
  }

  // Custom sign-up function that creates a user in Supabase and then signs in with NextAuth
  const register = async (email: string, password: string, userData: any) => {
    try {
      // First create the user in Supabase
      const supabase = createClientBrowser()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      })

      if (error) {
        return { success: false, error: error.message }
      }

      // Create profile in the profiles table
      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          email: email,
          full_name: userData.full_name,
          phone: userData.phone,
          ...userData,
        })

        if (profileError) {
          console.error("Profile creation error:", profileError)
          return { success: false, error: profileError.message }
        }
        
        // Now sign in with NextAuth
        const loginResult = await login(email, password)
        
        return { 
          ...loginResult,
          userId: data.user.id, // Include the userId in the response
          success: loginResult.success
        }
      }

      return { success: false, error: "User creation failed" }
    } catch (error: any) {
      console.error("Registration error:", error)
      return { success: false, error: error.message || "Registration failed" }
    }
  }

  // Logout function
  const logout = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  // Function to refresh profile data
  const refreshProfile = async () => {
    if (session?.user?.id) {
      const supabase = createClientBrowser()
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single()
      
      // We can't directly update the session, so we'll reload the page
      if (data) {
        window.location.reload()
      }
    }
  }

  return {
    session,
    user: session?.user || null,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshProfile,
  }
}
