"use server"

import { getCurrentUser, getCurrentProfile } from "@/lib/auth"
import { createClientServer } from "@/lib/supabase"
import { env } from "@/lib/env"
import { getServerConfig } from "@/lib/server-config"
import { initiatePayment, verifyPayment } from "@/lib/paystack"
import { revalidatePath } from "next/cache"

// Initialize payment for registration
export async function initializeRegistrationPayment() {
  const user = await getCurrentUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const profile = await getCurrentProfile()

  if (!profile) {
    return { success: false, error: "Profile not found" }
  }

  // Check if already paid
  if (profile.payment_status === "paid") {
    return { success: false, error: "You have already paid for this conference" }
  }

  // Get registration amount from config
  const registrationAmount = await getServerConfig<number>("registrationAmount", 15000)

  try {
    // Create payment
    const payment = await initiatePayment({
      email: profile.email, // Use the email saved in the database
      amount: registrationAmount * 100, // Paystack requires amount in kobo
      metadata: {
        user_id: user.id,
        full_name: profile.full_name,
        payment_type: "registration",
      },
      callback_url: `${env.NEXT_PUBLIC_APP_URL}/payment/verify`,
    })

    if (!payment.authorization_url) {
      return { success: false, error: "Failed to initialize payment" }
    }

    // Update profile with payment reference
    const supabase = createClientServer()

    await supabase
      .from("profiles")
      .update({
        payment_reference: payment.reference,
        payment_amount: registrationAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    return {
      success: true,
      authorizationUrl: payment.authorization_url,
      reference: payment.reference,
    }
  } catch (error: any) {
    console.error("Payment initialization error:", error)
    return { success: false, error: error.message || "Payment initialization failed" }
  }
}

// Verify registration payment
export async function verifyRegistrationPayment(reference: string) {
  try {
    // Verify payment with Paystack
    const paymentData = await verifyPayment(reference)

    // Update the profile with payment status
    const supabase = createClientServer()

    if (paymentData.status === "success") {
      await supabase
        .from("profiles")
        .update({
          payment_status: "paid",
          payment_date: paymentData.paid_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("payment_reference", reference)

      revalidatePath("/participant/dashboard")
      return { success: true, status: "paid" }
    } else {
      await supabase
        .from("profiles")
        .update({
          payment_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("payment_reference", reference)

      return { success: true, status: "failed" }
    }
  } catch (error: any) {
    console.error("Error verifying payment:", error)
    return { success: false, error: error.message }
  }
}

// Initialize hotel booking payment
export async function initializeHotelBookingPayment(
  hotelId: string,
  checkInDate: string,
  checkOutDate: string,
  totalAmount: number,
) {
  const user = await getCurrentUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const profile = await getCurrentProfile()

  if (!profile) {
    return { success: false, error: "Profile not found" }
  }

  // Generate a unique reference
  const reference = `HOTEL-${Date.now()}-${user.id.substring(0, 8)}`

  try {
    // Initialize payment with Paystack
    const paymentData = await initiatePayment({
      email: profile.email || `${profile.phone}@napps.org`,
      amount: totalAmount * 100,
      reference: reference,
      metadata: {
        userId: user.id,
        paymentType: "hotel",
        hotelId,
        checkInDate,
        checkOutDate,
      },
      callback_url: `${env.NEXT_PUBLIC_APP_URL}/payment/verify`,
    })

    // Create booking record
    const supabase = createClientServer()
    const { error } = await supabase.from("bookings").insert({
      user_id: user.id,
      hotel_id: hotelId,
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      status: "pending",
      payment_reference: reference,
      payment_status: "pending",
      total_amount: totalAmount,
    })

    if (error) {
      console.error("Error creating booking:", error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      authorizationUrl: paymentData.authorization_url,
      reference: paymentData.reference,
    }
  } catch (error: any) {
    console.error("Error initializing hotel payment:", error)
    return { success: false, error: error.message }
  }
}

// Verify hotel booking payment
export async function verifyHotelBookingPayment(reference: string) {
  try {
    // Verify payment with Paystack
    const paymentData = await verifyPayment(reference)

    // Update the booking with payment status
    const supabase = createClientServer()

    if (paymentData.status === "success") {
      await supabase
        .from("bookings")
        .update({
          payment_status: "paid",
          status: "confirmed",
          updated_at: new Date().toISOString(),
        })
        .eq("payment_reference", reference)

      revalidatePath("/participant/accommodation")
      return { success: true, status: "paid" }
    } else {
      await supabase
        .from("bookings")
        .update({
          payment_status: "failed",
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("payment_reference", reference)

      return { success: true, status: "failed" }
    }
  } catch (error: any) {
    console.error("Error verifying hotel payment:", error)
    return { success: false, error: error.message }
  }
}

