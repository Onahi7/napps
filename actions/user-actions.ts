"use server"

import { createClientServer } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { isAdmin } from "@/lib/auth"
import type { Database } from "@/lib/database.types"

// Types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]

// Get all users
export async function getAllUsers() {
  const supabase = createClientServer()

  const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching users:", error)
    return []
  }

  return data as Profile[]
}

// Get users by role
export async function getUsersByRole(role: string) {
  const supabase = createClientServer()

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", role)
    .order("created_at", { ascending: false })

  if (error) {
    console.error(`Error fetching ${role}s:`, error)
    return []
  }

  return data as Profile[]
}

// Get user by ID
export async function getUserById(id: string) {
  const supabase = createClientServer()

  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching user:", error)
    return null
  }

  return data as Profile
}

// Update user role
export async function updateUserRole(userId: string, role: string) {
  try {
    // Check if user is admin
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return { success: false, error: "Unauthorized" }
    }

    const supabase = createClientServer()

    const { error } = await supabase
      .from("profiles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", userId)

    if (error) {
      console.error("Error updating user role:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/participants")
    revalidatePath("/admin/validators")

    return { success: true }
  } catch (error: any) {
    console.error("Error in updateUserRole:", error)
    return { success: false, error: error.message || "Failed to update user role" }
  }
}

// Delete user
export async function deleteUser(userId: string) {
  try {
    // Check if user is admin
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return { success: false, error: "Unauthorized" }
    }

    const supabase = createClientServer()

    // Delete user auth record
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)

    if (authError) {
      console.error("Error deleting user auth record:", authError)
      return { success: false, error: authError.message }
    }

    // Delete user profile
    const { error: profileError } = await supabase.from("profiles").delete().eq("id", userId)

    if (profileError) {
      console.error("Error deleting user profile:", profileError)
      return { success: false, error: profileError.message }
    }

    revalidatePath("/admin/participants")
    revalidatePath("/admin/validators")

    return { success: true }
  } catch (error: any) {
    console.error("Error in deleteUser:", error)
    return { success: false, error: error.message || "Failed to delete user" }
  }
}

