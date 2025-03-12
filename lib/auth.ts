"use server"
import { createClientServer } from "@/lib/supabase"
import type { Database } from "@/lib/database.types"

// Types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]

// Get current logged in user
export async function getCurrentUser() {
  const supabase = createClientServer()

  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    console.error("Error getting user:", error)
    return null
  }

  return data.user
}

// Get current user profile
export async function getCurrentProfile() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const supabase = createClientServer()

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (error || !data) {
    console.error("Error getting profile:", error)
    return null
  }

  return data as Profile
}

// Check if user has admin role
export async function isAdmin() {
  const profile = await getCurrentProfile()
  return profile?.role === "admin"
}

// Check if user has validator role
export async function isValidator() {
  const profile = await getCurrentProfile()
  return profile?.role === "validator"
}

// Check if user has participant role
export async function isParticipant() {
  const profile = await getCurrentProfile()
  return profile?.role === "participant"
}

// Require a specific role
export async function requireRole(role: string) {
  const profile = await getCurrentProfile()

  if (!profile) {
    throw new Error("Authentication required")
  }

  if (profile.role !== role) {
    throw new Error(`Requires ${role} role`)
  }

  return profile
}

