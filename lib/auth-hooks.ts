"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { createClientBrowser } from "@/lib/supabase"

export function useAuth() {
  const { data: session, status } = useSession()
  const isLoading = status === "loading"
  const isAuthenticated = status === "authenticated"

  // Custom sign-in function that uses NextAuth
  const login = async (identifier: string, loginMethod: "email" | "phone", password: string = "", isAdmin: boolean = false) => {
    try {
      const result = await signIn("credentials", {
        identifier,
        password,
        loginMethod,
        isAdmin: isAdmin.toString(),
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

  // Custom sign-up function that creates a user in Supabase (simplified for passwordless auth)
  const register = async (email: string, phone: string, userData: any) => {
    try {
      const supabase = createClientBrowser()

      // Properly format the phone number for SQL query to avoid injection risks
      // Check for existing phone or email with better SQL injection protection
      const { data: existingUser, error: queryError } = await supabase
        .from("profiles")
        .select("phone, email")
        .or(`phone.eq."${phone}",email.eq."${email}"`)
        .maybeSingle()

      if (queryError) {
        console.error("Error checking existing user:", queryError)
        return { success: false, error: "Error checking user existence" }
      }

      if (existingUser) {
        if (existingUser.phone === phone) {
          return { success: false, error: "This phone number is already registered" }
        }
        if (existingUser.email === email) {
          return { success: false, error: "This email is already registered" }
        }
        return { success: false, error: "This email or phone number is already registered" }
      }

      // For regular users, we create a random password - user will login passwordless
      const randomPassword = Math.random().toString(36).slice(-10);
      
      console.log("Creating new user with email:", email)

      // Create the auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password: randomPassword,
        options: {
          data: {
            phone,
            full_name: userData.full_name,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      })

      if (error) {
        console.error("Auth error:", error)
        return { success: false, error: error.message }
      }

      if (!data.user || !data.user.id) {
        console.error("User creation failed - no user data returned")
        return { success: false, error: "Failed to create user account" }
      }

      console.log("Auth user created successfully with ID:", data.user.id)

      // Create profile in the profiles table
      const profileData = {
        id: data.user.id,
        email: email,
        full_name: userData.full_name,
        phone: phone,
        role: "participant",
        payment_status: "pending",
        ...userData
      }

      console.log("Inserting profile data:", profileData)

      const { error: profileError } = await supabase
        .from("profiles")
        .insert(profileData)

      if (profileError) {
        console.error("Profile creation error:", profileError)
        
        // Try to clean up the auth user if profile creation fails
        await supabase.auth.admin.deleteUser(data.user.id)
        
        if (profileError.code === '23505') { // Unique constraint violation
          return { success: false, error: "This email or phone number is already registered" }
        }
        return { success: false, error: profileError.message }
      }
      
      console.log("Profile created successfully")
      
      return { 
        success: true, 
        userId: data.user.id 
      }
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
