'use server';

import { createClientServer } from "@/lib/supabase"
import { parseConfigValue } from "@/lib/config-service"

// Get a config value by key for server-side use
export async function getServerConfig<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const supabase = createClientServer()

    const { data, error } = await supabase.from("config").select("value").eq("key", key).single()

    if (error || !data) {
      console.error(`Error fetching config for key ${key}:`, error)
      return defaultValue
    }

    return parseConfigValue(data.value) || defaultValue
  } catch (error) {
    console.error(`Error in getServerConfig for key ${key}:`, error)
    return defaultValue
  }
}

// Get registration amount
export async function getRegistrationAmount(): Promise<number> {
  return getServerConfig<number>("registrationAmount", 15000)
}

