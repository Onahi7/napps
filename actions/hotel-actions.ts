"use server"

import { createClientServer } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import type { Database } from "@/lib/database.types"

type Hotel = Database["public"]["Tables"]["hotels"]["Row"]
type Booking = Database["public"]["Tables"]["bookings"]["Row"]

// Get all hotels
export async function getHotels(): Promise<Hotel[]> {
  const supabase = createClientServer()

  const { data, error } = await supabase
    .from("hotels")
    .select("*")
    .order("featured", { ascending: false })
    .order("rating", { ascending: false })

  if (error) {
    console.error("Error fetching hotels:", error)
    return []
  }

  return data || []
}

// Get hotel by ID
export async function getHotelById(id: string): Promise<Hotel | null> {
  const supabase = createClientServer()

  const { data, error } = await supabase.from("hotels").select("*").eq("id", id).single()

  if (error || !data) {
    console.error("Error fetching hotel:", error)
    return null
  }

  return data
}

// Add a new hotel (admin only)
export async function addHotel(formData: FormData) {
  const user = await getCurrentUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const address = formData.get("address") as string
  const pricePerNight = Number(formData.get("pricePerNight"))
  const priceCategory = formData.get("priceCategory") as string
  const distanceFromVenue = Number(formData.get("distanceFromVenue"))
  const rating = Number(formData.get("rating") || 0)
  const imageFile = formData.get("image") as File
  const availableRooms = Number(formData.get("availableRooms"))
  const amenitiesString = formData.get("amenities") as string
  const contactPhone = formData.get("contactPhone") as string
  const contactWhatsapp = formData.get("contactWhatsapp") as string
  const featured = formData.get("featured") === "true"

  const amenities = amenitiesString.split(",").map((item) => item.trim())

  const supabase = createClientServer()

  let imageUrl = ""

  // Upload the image to Supabase Storage if provided
  if (imageFile && imageFile.size > 0) {
    const { data: fileData, error: fileError } = await supabase.storage
      .from("hotels")
      .upload(`${Date.now()}-${imageFile.name}`, imageFile, {
        cacheControl: "3600",
        upsert: true,
      })

    if (fileError) {
      console.error("Error uploading hotel image:", fileError)
      return { success: false, error: fileError.message }
    }

    // Get the public URL
    const { data: urlData } = supabase.storage.from("hotels").getPublicUrl(fileData.path)
    imageUrl = urlData.publicUrl
  }

  // Create the hotel record
  const { error } = await supabase.from("hotels").insert({
    name,
    description,
    address,
    price_per_night: pricePerNight,
    price_category: priceCategory,
    distance_from_venue: distanceFromVenue,
    rating,
    image_url: imageUrl,
    available_rooms: availableRooms,
    amenities,
    contact_phone: contactPhone,
    contact_whatsapp: contactWhatsapp,
    featured,
  })

  if (error) {
    console.error("Error creating hotel:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/hotels")
  return { success: true }
}

// Update a hotel (admin only)
export async function updateHotel(id: string, formData: FormData) {
  const user = await getCurrentUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const address = formData.get("address") as string
  const pricePerNight = Number(formData.get("pricePerNight"))
  const priceCategory = formData.get("priceCategory") as string
  const distanceFromVenue = Number(formData.get("distanceFromVenue"))
  const rating = Number(formData.get("rating") || 0)
  const imageFile = formData.get("image") as File | null
  const availableRooms = Number(formData.get("availableRooms"))
  const amenitiesString = formData.get("amenities") as string
  const contactPhone = formData.get("contactPhone") as string
  const contactWhatsapp = formData.get("contactWhatsapp") as string
  const featured = formData.get("featured") === "true"

  const amenities = amenitiesString.split(",").map((item) => item.trim())

  const supabase = createClientServer()

  let imageUrl = formData.get("currentImageUrl") as string

  // If a new image is provided, upload it
  if (imageFile && imageFile.size > 0) {
    const { data: fileData, error: fileError } = await supabase.storage
      .from("hotels")
      .upload(`${Date.now()}-${imageFile.name}`, imageFile, {
        cacheControl: "3600",
        upsert: true,
      })

    if (fileError) {
      console.error("Error uploading hotel image:", fileError)
      return { success: false, error: fileError.message }
    }

    // Get the public URL
    const { data: urlData } = supabase.storage.from("hotels").getPublicUrl(fileData.path)

    imageUrl = urlData.publicUrl
  }

  // Update the hotel record
  const { error } = await supabase
    .from("hotels")
    .update({
      name,
      description,
      address,
      price_per_night: pricePerNight,
      price_category: priceCategory,
      distance_from_venue: distanceFromVenue,
      rating,
      image_url: imageUrl,
      available_rooms: availableRooms,
      amenities,
      contact_phone: contactPhone,
      contact_whatsapp: contactWhatsapp,
      featured,
    })
    .eq("id", id)

  if (error) {
    console.error("Error updating hotel:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/hotels")
  return { success: true }
}

// Delete a hotel (admin only)
export async function deleteHotel(id: string) {
  const user = await getCurrentUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const supabase = createClientServer()

  // Delete the hotel record
  const { error } = await supabase.from("hotels").delete().eq("id", id)

  if (error) {
    console.error("Error deleting hotel:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/hotels")
  return { success: true }
}

// Get user's bookings
export async function getUserBookings() {
  const user = await getCurrentUser()

  if (!user) {
    return []
  }

  const supabase = createClientServer()

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      *,
      hotel:hotel_id (
        id,
        name,
        image_url,
        contact_phone,
        contact_whatsapp
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching bookings:", error)
    return []
  }

  return data || []
}

// Create a booking
export async function createBooking(formData: FormData) {
  const user = await getCurrentUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const hotelId = formData.get("hotelId") as string
  const roomType = formData.get("roomType") as string
  const checkInDate = formData.get("checkInDate") as string
  const checkOutDate = formData.get("checkOutDate") as string
  const totalNights = Number(formData.get("totalNights"))
  const pricePerNight = Number(formData.get("pricePerNight"))
  const totalAmount = Number(formData.get("totalAmount"))
  const specialRequests = formData.get("specialRequests") as string

  const supabase = createClientServer()

  // Create the booking record
  const { data, error } = await supabase
    .from("bookings")
    .insert({
      user_id: user.id,
      hotel_id: hotelId,
      room_type: roomType,
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      total_nights: totalNights,
      price_per_night: pricePerNight,
      total_amount: totalAmount,
      special_requests: specialRequests,
      status: "pending",
      payment_status: "pending",
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating booking:", error)
    return { success: false, error: error.message }
  }

  // Update available rooms count
  const { error: updateError } = await supabase.rpc("decrement_available_rooms", {
    hotel_id_param: hotelId,
  })

  if (updateError) {
    console.error("Error updating available rooms:", updateError)
    // We don't return an error here as the booking was created successfully
  }

  return { success: true, bookingId: data.id }
}

