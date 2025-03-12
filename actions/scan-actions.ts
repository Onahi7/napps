"use server"

import { createClientServer } from "@/lib/supabase"

// Get all scans by validator ID
export async function getScansByValidator(validatorId: string) {
  const supabase = createClientServer()

  const { data, error } = await supabase
    .from("scans")
    .select(`
      id,
      scan_type,
      created_at,
      participant_id,
      profiles(full_name)
    `)
    .eq("validator_id", validatorId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching scans:", error)
    return []
  }

  // Format the data to include participant name
  return data.map((scan) => ({
    ...scan,
    participant_name: scan.profiles?.full_name || "Unknown Participant",
  }))
}

// Get validator assignments
export async function getValidatorAssignments(validatorId: string) {
  const supabase = createClientServer()

  const { data, error } = await supabase.from("validator_assignments").select("*").eq("validator_id", validatorId)

  if (error) {
    console.error("Error fetching validator assignments:", error)
    return []
  }

  return data
}

// Process a QR code scan
export async function processQrScan(qrData: string, scanType: string, validatorId: string) {
  const supabase = createClientServer()

  try {
    // Parse QR data
    const parsedData = JSON.parse(qrData)
    const participantId = parsedData.id

    if (!participantId) {
      return { success: false, message: "Invalid QR code data" }
    }

    // Check if participant exists and is paid
    const { data: participant, error: participantError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", participantId)
      .eq("payment_status", "paid")
      .single()

    if (participantError || !participant) {
      return {
        success: false,
        message: "Participant not found or payment not confirmed",
      }
    }

    // Check if this scan type has already been processed for this participant today
    const today = new Date().toISOString().split("T")[0]
    const { data: existingScan, error: scanError } = await supabase
      .from("scans")
      .select("*")
      .eq("participant_id", participantId)
      .eq("scan_type", scanType)
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`)

    if (!scanError && existingScan && existingScan.length > 0) {
      return {
        success: false,
        message: `This participant has already been validated for ${scanType} today`,
      }
    }

    // Record the scan
    const { error: insertError } = await supabase.from("scans").insert({
      participant_id: participantId,
      validator_id: validatorId,
      scan_type: scanType,
    })

    if (insertError) {
      console.error("Error recording scan:", insertError)
      return { success: false, message: "Error recording scan" }
    }

    return {
      success: true,
      message: `${scanType} validation successful for ${participant.full_name}`,
      participant: participant,
    }
  } catch (error) {
    console.error("Error processing QR scan:", error)
    return { success: false, message: "Invalid QR code format" }
  }
}

// Get scan history with participant details
export async function getScanHistory(limit = 50) {
  const supabase = createClientServer()

  const { data, error } = await supabase
    .from("scans")
    .select(`
      id,
      scan_type,
      created_at,
      participant_id,
      validator_id,
      profiles!scans_participant_id_fkey(full_name, email, phone),
      profiles!scans_validator_id_fkey(full_name)
    `)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching scan history:", error)
    return []
  }

  // Format the data to include participant and validator names
  return data.map((scan) => ({
    ...scan,
    participant_name: scan.profiles?.full_name || "Unknown",
    validator_name: scan.profiles?.full_name || "Unknown",
  }))
}

