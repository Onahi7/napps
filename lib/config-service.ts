'use server'
import { query } from "@/lib/db"
import { CacheService } from "@/lib/cache"
import { getServerSession } from "next-auth";
import { authOptions } from "./auth-options";

const CONFIG_CACHE_PREFIX = 'config:'
const cache = CacheService.getInstance()

export interface ConferenceDetails {
  name: string
  date: string
  venue: string
  theme?: string
  bankName?: string
  accountNumber?: string
  accountName?: string
}

export interface ConferenceDetailsResponse {
  name: string;
  date: string;
  venue: string;
  venue_address: string;
  theme: string;
  registration_hours: string;
  morning_hours: string;
  afternoon_hours: string;
  evening_hours: string;
}

// Get a config value by key
export async function getConfig(key: string): Promise<any> {
  try {
    const result = await query(
      'SELECT value FROM config WHERE key = $1',
      [key]
    )
    
    if (!result.rows[0]) {
      return null
    }
    
    const value = result.rows[0].value
    return typeof value === 'string' ? JSON.parse(value) : value
  } catch (error) {
    console.error(`Error in getConfig for key ${key}:`, error)
    return null
  }
}

// Get configuration with forced revalidation
export async function getConfigWithRevalidate(key: string) {
  // Clear cache first
  await cache.del(`${CONFIG_CACHE_PREFIX}${key}`)
  
  // Fetch fresh data
  const result = await query(
    'SELECT value FROM config WHERE key = $1',
    [key]
  )

  const value = result.rows[0]?.value
  if (value) {
    // Cache with shorter TTL for admin changes
    await cache.set(`${CONFIG_CACHE_PREFIX}${key}`, value, 60) // 1 minute cache
  }

  return value
}

// Update a config value
export async function updateConfig(key: string, value: any): Promise<{ success: boolean; error?: string }> {
  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value)
    await query(
      `INSERT INTO config (key, value) 
       VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = $2`,
      [key, stringValue]
    )
    
    // Clear cache for this key
    await cache.del(`config:${key}`)
    return { success: true }
  } catch (error: any) {
    console.error(`Error in updateConfig for key ${key}:`, error)
    return { success: false, error: error.message }
  }
}

// Get specific configs
export async function getRegistrationAmount(): Promise<number> {
  try {
    const result = await query(
      'SELECT value FROM config WHERE key = $1',
      ['registrationAmount']
    )
    
    if (!result.rows[0]) {
      return 20000 // Default registration amount if not set in config
    }
    
    const value = result.rows[0].value
    const amount = typeof value === 'string' ? JSON.parse(value) : value
    return amount || 20000 // Fallback to 20000 if the value is null/undefined/0
  } catch (error) {
    console.error('Error getting registration amount:', error)
    return 20000 // Default amount in case of error
  }
}

export interface ConferenceHours {
  registration: string;
  morning: string;
  afternoon: string;
  evening: string;
}

export async function getConferenceDetails(): Promise<ConferenceDetailsResponse> {
  const cachedConfig = await cache.get('conference_details')
  if (cachedConfig) {
    const parsed = typeof cachedConfig === 'string' ? JSON.parse(cachedConfig) : cachedConfig
    // Validate that parsed data has all required fields
    if (typeof parsed === 'object' && parsed !== null &&
        'name' in parsed && 'date' in parsed && 'venue' in parsed &&
        'venue_address' in parsed && 'theme' in parsed &&
        'registration_hours' in parsed && 'morning_hours' in parsed &&
        'afternoon_hours' in parsed && 'evening_hours' in parsed) {
      return parsed as ConferenceDetailsResponse
    }
  }
  
  const [name, date, venue, theme, venue_address, hours] = await Promise.all([
    getServerConfig<string>("conference_name", ""),
    getServerConfig<string>("conference_date", ""),
    getServerConfig<string>("conference_venue", ""),
    getServerConfig<string>("conference_theme", ""),
    getServerConfig<string>("venue_address", ""),
    getServerConfig<ConferenceHours>("conference_hours", {
      registration: "",
      morning: "",
      afternoon: "",
      evening: ""
    })
  ])

  const details = {
    name,
    date,
    venue,
    venue_address,
    theme,
    registration_hours: hours.registration,
    morning_hours: hours.morning,
    afternoon_hours: hours.afternoon,
    evening_hours: hours.evening
  }

  await cache.set('conference_details', details, 3600) // Cache for 1 hour
  return details
}

// Get essential conference settings
export async function getConferenceConfig() {
  return cache.cached('conference_config', async () => {
    const result = await query(`
      SELECT key, value 
      FROM config 
      WHERE key IN (
        'conference_name',
        'conference_date',
        'conference_venue',
        'conference_theme',
        'registrationAmount',
        'bankName',
        'accountNumber',
        'accountName'
      )
    `)

    const config: Record<string, any> = {}
    for (const row of result.rows) {
      config[row.key] = typeof row.value === 'string' 
        ? JSON.parse(row.value) 
        : row.value
    }

    return config
  }, 3600) // Cache for 1 hour
}

// Initialize default configuration
export async function initializeDefaultConfig(): Promise<void> {
  const defaultConfig = {
    registrationAmount: 20000,
    conference_name: '',
    conference_date: '',
    conference_venue: '',
    conference_theme: '',
    payment_split_code: null,
    bankName: '',
    accountNumber: '',
    accountName: ''
  }

  for (const [key, value] of Object.entries(defaultConfig)) {
    await updateConfig(key, value)
  }
}

export async function updateConferenceDetails(details: Partial<ConferenceDetails>) {
  const updates = [
    { key: 'conference_name', value: details.name },
    { key: 'conference_date', value: details.date },
    { key: 'conference_venue', value: details.venue },
    { key: 'conference_theme', value: details.theme },
    { key: 'bankName', value: details.bankName },
    { key: 'accountNumber', value: details.accountNumber },
    { key: 'accountName', value: details.accountName },
  ].filter(update => update.value !== undefined)

  for (const { key, value } of updates) {
    await updateConfig(key, value)
  }
}

// Get config value from database
export async function getServerConfig<T>(key: string, defaultValue?: T): Promise<T> {
  try {
    const result = await query(
      'SELECT value FROM config WHERE key = $1',
      [key]
    )

    if (!result.rows.length) {
      return defaultValue as T
    }
    
    const value = result.rows[0].value
    return typeof value === 'string' ? JSON.parse(value) : value
  } catch (error) {
    console.error(`Error in getServerConfig for key ${key}:`, error)
    return defaultValue as T
  }
}

// Get or initialize payment split configuration
export async function getPaymentSplitConfig() {
  return getServerConfig<string>("payment_split_code", "")
}

