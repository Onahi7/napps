'use server'
import { query } from "@/lib/db"
import { CacheService } from "@/lib/cache"

const cache = CacheService.getInstance()

export interface ConferenceDetails {
  name: string
  date: string
  venue: string
  theme?: string
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
    theme: config.conference_theme || 'ADVANCING INTEGRATED TECHNOLOGY FOR SUSTAINABLE PRIVATE EDUCATION PRACTICE'
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
        'registrationAmount'
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
    registrationAmount: 15000,
    conference_name: '6th Annual NAPPS North Central Zonal Education Summit 2025',
    conference_date: 'May 21-22, 2025',
    conference_venue: 'Lafia City Hall, Lafia',
    conference_theme: 'ADVANCING INTEGRATED TECHNOLOGY FOR SUSTAINABLE PRIVATE EDUCATION PRACTICE',
    payment_split_code: null
  }

  for (const [key, value] of Object.entries(defaultConfig)) {
    await updateConfig(key, value)
  }
}

