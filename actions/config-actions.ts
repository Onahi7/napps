'use server'

import { query } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { revalidatePath } from 'next/cache'
import { CacheService } from '@/lib/cache'

interface ConfigRow {
  key: string;
  value: any;
  description?: string;
}

const cache = CacheService.getInstance()
const CONFIG_CACHE_PREFIX = 'config:'
const CONFIG_CACHE_TTL = 300 // 5 minutes

export async function getConfig(key: string): Promise<any> {
  // Check cache first
  const cached = await cache.get(`${CONFIG_CACHE_PREFIX}${key}`)
  if (cached) return cached

  // Fetch from database
  const result = await query(
    'SELECT value FROM config WHERE key = $1',
    [key]
  )

  const value = result.rows[0]?.value
  if (value) {
    // Cache the result
    await cache.set(`${CONFIG_CACHE_PREFIX}${key}`, value, CONFIG_CACHE_TTL)
  }

  return value
}

// Alias for getConfig to maintain compatibility with existing imports
export const getConfigByKey = getConfig;

export async function updateConfig(key: string, value: any) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  // Validate admin access
  const profile = await query(
    'SELECT role FROM profiles WHERE id = $1',
    [session.user.id]
  )
  if (profile.rows[0]?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required')
  }

  // Update config
  await query(
    `INSERT INTO config (key, value)
     VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = $2`,
    [key, JSON.stringify(value)]
  )

  // Invalidate cache
  await cache.del(`${CONFIG_CACHE_PREFIX}${key}`)

  // Revalidate all pages that might show the price
  revalidatePath('/admin/settings')
  revalidatePath('/payment')
  revalidatePath('/register')
  revalidatePath('/participant/dashboard')
  revalidatePath('/dashboard')
  
  return { success: true }
}

export async function getAllConfig() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  const cached = await cache.get(`${CONFIG_CACHE_PREFIX}all`)
  if (cached) return cached

  const result = await query(
    'SELECT key, value, description FROM config ORDER BY key'
  )

  const config = result.rows.map((row: ConfigRow) => ({
    ...row,
    value: typeof row.value === 'string' ? JSON.parse(row.value) : row.value
  }))

  await cache.set(`${CONFIG_CACHE_PREFIX}all`, config, CONFIG_CACHE_TTL)
  return config
}

export async function getConferenceConfig() {
  // Get essential conference settings with caching
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

export async function initializeDefaultConfig() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  // Validate admin access
  const profile = await query(
    'SELECT role FROM profiles WHERE id = $1',
    [session.user.id]
  )
  if (profile.rows[0]?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required')
  }

  const defaultConfig = {
    registrationAmount: 20000,
    conference_name: '6th Annual NAPPS North Central Zonal Education Summit 2025',
    conference_date: 'May 21-22, 2025',
    conference_venue: 'Lafia City Hall, Lafia',
    conference_theme: 'ADVANCING INTEGRATED TECHNOLOGY FOR SUSTAINABLE PRIVATE EDUCATION PRACTICE',
    payment_split_code: null
  }

  for (const [key, value] of Object.entries(defaultConfig)) {
    await query(
      `INSERT INTO config (key, value)
       VALUES ($1, $2)
       ON CONFLICT (key) DO NOTHING`,
      [key, JSON.stringify(value)]
    )
  }

  // Clear all config cache
  await cache.invalidatePattern(`${CONFIG_CACHE_PREFIX}*`)

  revalidatePath('/admin/settings')
  return { success: true }
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

