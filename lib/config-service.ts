import { getConfig as getConfigFromDB, updateConfig as updateConfigInDB } from "@/actions/config-actions"

// Type for the configuration
export type AppConfig = {
  registrationAmount: number
  registrationAmountFormatted: string
  conferenceDate: string
  conferenceLocation: string
  conferenceVenue: string
  [key: string]: any
}

// Format currency amount
export function formatCurrency(amount: number): string {
  return `₦${amount.toLocaleString()}`
}

// Helper to parse JSON values from the database
export function parseConfigValue(value: any): any {
  if (typeof value === "string") {
    try {
      return JSON.parse(value)
    } catch (e) {
      return value
    }
  }
  return value
}

// Get config value - exported for backward compatibility
export async function getConfig(key: string): Promise<any> {
  return getConfigFromDB(key)
}

// Get registration amount
export async function getRegistrationAmount(): Promise<number> {
  try {
    const result = await getConfigFromDB("registrationAmount")
    return parseConfigValue(result) || 15000
  } catch (error) {
    console.error("Error getting registration amount:", error)
    return 15000 // Default fallback
  }
}

// Get conference details
export async function getConferenceDetails(): Promise<{
  conference_name: string
  conference_date: string
  conference_venue: string
  conference_theme: string
} | null> {
  try {
    const [name, date, venue, theme] = await Promise.all([
      getConfigFromDB("conference_name"),
      getConfigFromDB("conference_date"),
      getConfigFromDB("conference_venue"),
      getConfigFromDB("conference_theme"),
    ])

    return {
      conference_name: name || "6th Annual NAPPS North Central Zonal Education Summit 2025",
      conference_date: date || "May 21-22, 2025",
      conference_venue: venue || "Lafia City Hall, Lafia",
      conference_theme: theme || "ADVANCING INTEGRATED TECHNOLOGY FOR SUSTAINABLE PRIVATE EDUCATION PRACTICE",
    }
  } catch (error) {
    console.error("Error getting conference details:", error)
    return null
  }
}

// Update registration amount (handles both the numeric and formatted values)
export async function updateRegistrationAmount(amount: number): Promise<{ success: boolean; error?: string }> {
  const formatted = formatCurrency(amount)

  try {
    // Update the numeric value
    const numericResult = await updateConfigInDB("registrationAmount", amount)

    if (!numericResult.success) {
      return numericResult
    }

    // Update the formatted value
    const formattedResult = await updateConfigInDB("registrationAmountFormatted", formatted)

    return formattedResult
  } catch (error) {
    console.error("Error updating registration amount:", error)
    return { success: false, error: "Failed to update registration amount" }
  }
}

