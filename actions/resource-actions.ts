"use server"

import { createClientServer } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import type { Database } from "@/lib/database.types"

type Resource = Database["public"]["Tables"]["resources"]["Row"]

// Get all resources
export async function getResources(): Promise<Resource[]> {
  const supabase = createClientServer()

  const { data, error } = await supabase.from("resources").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching resources:", error)
    return []
  }

  return data
}

// Add a new resource (admin only)
export async function addResource(formData: FormData) {
  const user = await getCurrentUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const file = formData.get("file") as File

  const supabase = createClientServer()

  // Determine file type
  const fileType = file.type.split("/")[0] || "document"

  // Upload the file to Supabase Storage
  const { data: fileData, error: fileError } = await supabase.storage
    .from("resources")
    .upload(`${Date.now()}-${file.name}`, file, {
      cacheControl: "3600",
      upsert: true,
    })

  if (fileError) {
    console.error("Error uploading resource file:", fileError)
    return { success: false, error: fileError.message }
  }

  // Get the public URL
  const { data: urlData } = supabase.storage.from("resources").getPublicUrl(fileData.path)

  // Create the resource record
  const { error } = await supabase.from("resources").insert({
    title,
    description,
    file_url: urlData.publicUrl,
    file_type: fileType,
    uploaded_by: user.id,
  })

  if (error) {
    console.error("Error creating resource:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/resources")
  return { success: true }
}

// Delete a resource (admin only)
export async function deleteResource(id: string) {
  const user = await getCurrentUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const supabase = createClientServer()

  // Get the resource to find the file path
  const { data: resource, error: fetchError } = await supabase
    .from("resources")
    .select("file_url")
    .eq("id", id)
    .single()

  if (fetchError) {
    console.error("Error fetching resource:", fetchError)
    return { success: false, error: fetchError.message }
  }

  // Delete the resource record
  const { error } = await supabase.from("resources").delete().eq("id", id)

  if (error) {
    console.error("Error deleting resource:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/resources")
  return { success: true }
}

