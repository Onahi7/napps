'use server';

import { query } from "@/lib/db"

// Get a config value by key for server-side use
export async function getServerConfig<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const result = await query(
      'SELECT value FROM config WHERE key = $1',
      [key]
    )
    
    if (!result.rows[0]) {
      return defaultValue
    }
    
    const value = result.rows[0].value
    return typeof value === 'string' ? JSON.parse(value) : value
  } catch (error) {
    console.error(`Error in getServerConfig for key ${key}:`, error)
    return defaultValue
  }
}

// Get registration amount
export async function getRegistrationAmount(): Promise<number> {
  return getServerConfig<number>("registrationAmount", 15000)
}

