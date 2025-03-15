'use server'
import { query } from "@/lib/db"
import { CacheService } from "@/lib/cache"

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
  return getConfig('registrationAmount') || 15000
}

export async function getConferenceDetails(): Promise<ConferenceDetails> {
  const cachedConfig = await cache.get('conference_details')
  if (cachedConfig) return cachedConfig as ConferenceDetails

  const config = await getConferenceConfig()
  const details: ConferenceDetails = {
    name: config.conference_name || '6th Annual NAPPS North Central Zonal Education Summit 2025',
    date: config.conference_date || 'May 21-22, 2025',
    venue: config.conference_venue || 'Lafia City Hall, Lafia',
    theme: config.conference_theme || 'ADVANCING INTEGRATED TECHNOLOGY FOR SUSTAINABLE PRIVATE EDUCATION PRACTICE',
    bankName: config.bankName || "First Bank",
    accountNumber: config.accountNumber || "1234567890",
    accountName: config.accountName || "NAPPS NORTH CENTRAL ZONE"
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
    conference_name: '6th Annual NAPPS North Central Zonal Education Summit 2025',
    conference_date: 'May 21-22, 2025',
    conference_venue: 'Lafia City Hall, Lafia',
    conference_theme: 'ADVANCING INTEGRATED TECHNOLOGY FOR SUSTAINABLE PRIVATE EDUCATION PRACTICE',
    payment_split_code: null,
    bankName: "First Bank",
    accountNumber: "1234567890",
    accountName: "NAPPS NORTH CENTRAL ZONE"
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

