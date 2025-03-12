"use server"

import { createClientServer } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function updateProfile(formData: {
  firstName: string
  lastName: string
  email: string
  phone: string
  organization: string
  bio: string
  dietaryRequirements: string
  // New school fields
  schoolName: string
  schoolAddress: string
  schoolCity: string
  schoolState: string
  schoolType: string
  // New NAPPS fields
  nappsPosition: string
  nappsChapter: string
}) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const supabase = await createClientServer()

    // First check if email is already taken by another user
    if (formData.email !== user.email) {
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", formData.email)
        .neq("id", user.id)
        .maybeSingle()

      if (existingUser) {
        return { success: false, error: "Email is already taken" }
      }

      // Update auth email first
      const { error: authError } = await supabase.auth.updateUser({
        email: formData.email,
      })

      if (authError) {
        return { success: false, error: authError.message }
      }
    }

    // Then update profile with all fields including new school and NAPPS information
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        email: formData.email,
        full_name: `${formData.firstName} ${formData.lastName}`.trim(),
        phone: formData.phone,
        organization: formData.organization,
        bio: formData.bio,
        dietary_requirements: formData.dietaryRequirements,
        // New school fields
        school_name: formData.schoolName,
        school_address: formData.schoolAddress,
        school_city: formData.schoolCity,
        school_state: formData.schoolState,
        school_type: formData.schoolType,
        // New NAPPS fields
        napps_position: formData.nappsPosition,
        napps_chapter: formData.nappsChapter,
        // Update timestamp
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (profileError) {
      return { success: false, error: profileError.message }
    }

    revalidatePath("/participant/profile")
    return { success: true }
  } catch (error: any) {
    console.error("Profile update error:", error)
    return { success: false, error: error.message }
  }
}
