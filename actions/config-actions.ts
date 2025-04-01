'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { revalidatePath } from 'next/cache'
import { PrismaClient } from '@prisma/client'
import { CacheService } from '@/lib/cache'

const prisma = new PrismaClient()
const cache = CacheService.getInstance()
const CONFIG_CACHE_PREFIX = 'config:'
const CONFIG_CACHE_TTL = 300 // 5 minutes

export interface ConferenceConfig {
  name: string
  date: string
  venue: string
  theme: string
  registrationOpen: boolean
  maxParticipants: number
  registrationFee: number
  bankName: string
  accountNumber: string
  accountName: string
  contactEmail: string
  description: string
}

export interface SystemConfig {
  maintenanceMode: boolean
  debugMode: boolean
  analyticsEnabled: boolean
  fileUploadLimit: number
  defaultResourceVisibility: 'public' | 'private'
  resourceCategories: string[]
  emailNotifications: boolean
  timezone: string
}

export async function getConfig(key: string): Promise<any> {
  // Try cache first
  const cachedValue = await cache.get(`${CONFIG_CACHE_PREFIX}${key}`)
  if (cachedValue && typeof cachedValue === 'string') {
    return JSON.parse(cachedValue)
  }

  try {
    const config = await prisma.config.findUnique({
      where: { key }
    })

    if (config) {
      // Cache the value
      await cache.set(
        `${CONFIG_CACHE_PREFIX}${key}`, 
        JSON.stringify(config.value),
        CONFIG_CACHE_TTL
      )
      return config.value
    }

    return null
  } catch (error) {
    console.error(`Error getting config ${key}:`, error)
    return null
  }
}

export async function setConfig(key: string, value: any, description?: string): Promise<boolean> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const admin = await prisma.admin.findFirst({
      where: { userId: session.user.id }
    })
    if (!admin) throw new Error('Not an admin')

    await prisma.config.upsert({
      where: { key },
      update: {
        value,
        description,
        updatedAt: new Date()
      },
      create: {
        key,
        value,
        description
      }
    })

    // Invalidate cache
    await cache.del(`${CONFIG_CACHE_PREFIX}${key}`)

    revalidatePath('/admin/settings')
    return true
  } catch (error) {
    console.error(`Error setting config ${key}:`, error)
    return false
  }
}

export async function deleteConfig(key: string): Promise<boolean> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const admin = await prisma.admin.findFirst({
      where: { userId: session.user.id }
    })
    if (!admin) throw new Error('Not an admin')

    await prisma.config.delete({
      where: { key }
    })

    // Invalidate cache
    await cache.del(`${CONFIG_CACHE_PREFIX}${key}`)

    revalidatePath('/admin/settings')
    return true
  } catch (error) {
    console.error(`Error deleting config ${key}:`, error)
    return false
  }
}

export async function getConferenceConfig(): Promise<ConferenceConfig> {
  const defaultConfig: ConferenceConfig = {
    name: 'NAPPS Annual Summit 2025',
    date: 'April 15-17, 2025',
    venue: 'Summit Events Center, Abuja',
    theme: 'Transforming Education Through Technology',
    registrationOpen: false,
    maxParticipants: 500,
    registrationFee: 20000,
    bankName: 'Unity Bank',
    accountNumber: '0017190877',
    accountName: 'NAPPS UNITY BANK',
    contactEmail: 'support@napps-summit.org',
    description: 'Annual gathering of private school proprietors'
  }

  try {
    const configs = await prisma.config.findMany({
      where: {
        key: {
          in: [
            'conference.name',
            'conference.date',
            'conference.venue',
            'conference.theme',
            'conference.registrationOpen',
            'conference.maxParticipants',
            'conference.registrationFee',
            'conference.bankName',
            'conference.accountNumber',
            'conference.accountName',
            'conference.contactEmail',
            'conference.description'
          ]
        }
      }
    })

    const configMap = configs.reduce((acc, config) => {
      const key = config.key.replace('conference.', '')
      acc[key] = config.value
      return acc
    }, {} as Record<string, any>)

    return {
      name: configMap.name || defaultConfig.name,
      date: configMap.date || defaultConfig.date,
      venue: configMap.venue || defaultConfig.venue,
      theme: configMap.theme || defaultConfig.theme,
      registrationOpen: configMap.registrationOpen ?? defaultConfig.registrationOpen,
      maxParticipants: configMap.maxParticipants || defaultConfig.maxParticipants,
      registrationFee: configMap.registrationFee || defaultConfig.registrationFee,
      bankName: configMap.bankName || defaultConfig.bankName,
      accountNumber: configMap.accountNumber || defaultConfig.accountNumber,
      accountName: configMap.accountName || defaultConfig.accountName,
      contactEmail: configMap.contactEmail || defaultConfig.contactEmail,
      description: configMap.description || defaultConfig.description
    }
  } catch (error) {
    console.error('Error getting conference config:', error)
    return defaultConfig
  }
}

export async function updateConferenceConfig(config: Partial<ConferenceConfig>): Promise<boolean> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const admin = await prisma.admin.findFirst({
      where: { userId: session.user.id }
    })
    if (!admin) throw new Error('Not an admin')

    const updates = Object.entries(config).map(([key, value]) => 
      prisma.config.upsert({
        where: { key: `conference.${key}` },
        update: { value },
        create: {
          key: `conference.${key}`,
          value,
          description: `Conference ${key}`
        }
      })
    )

    await prisma.$transaction(updates)

    // Invalidate all conference config cache keys
    await cache.invalidatePattern(`${CONFIG_CACHE_PREFIX}conference.*`)

    revalidatePath('/admin/settings')
    revalidatePath('/')
    return true
  } catch (error) {
    console.error('Error updating conference config:', error)
    return false
  }
}

export async function getSystemConfig(): Promise<SystemConfig> {
  const defaultConfig: SystemConfig = {
    maintenanceMode: false,
    debugMode: false,
    analyticsEnabled: true,
    fileUploadLimit: 5242880, // 5MB
    defaultResourceVisibility: 'private',
    resourceCategories: ['Documents', 'Presentations', 'Images', 'Videos'],
    emailNotifications: true,
    timezone: 'Africa/Lagos'
  }

  try {
    const configs = await prisma.config.findMany({
      where: {
        key: {
          in: [
            'system.maintenanceMode',
            'system.debugMode',
            'system.analyticsEnabled',
            'system.fileUploadLimit',
            'system.defaultResourceVisibility',
            'system.resourceCategories',
            'system.emailNotifications',
            'system.timezone'
          ]
        }
      }
    })

    const configMap = configs.reduce((acc, config) => {
      const key = config.key.replace('system.', '')
      acc[key] = config.value
      return acc
    }, {} as Record<string, any>)

    return {
      maintenanceMode: configMap.maintenanceMode ?? defaultConfig.maintenanceMode,
      debugMode: configMap.debugMode ?? defaultConfig.debugMode,
      analyticsEnabled: configMap.analyticsEnabled ?? defaultConfig.analyticsEnabled,
      fileUploadLimit: configMap.fileUploadLimit || defaultConfig.fileUploadLimit,
      defaultResourceVisibility: configMap.defaultResourceVisibility || defaultConfig.defaultResourceVisibility,
      resourceCategories: configMap.resourceCategories || defaultConfig.resourceCategories,
      emailNotifications: configMap.emailNotifications ?? defaultConfig.emailNotifications,
      timezone: configMap.timezone || defaultConfig.timezone
    }
  } catch (error) {
    console.error('Error getting system config:', error)
    return defaultConfig
  }
}

export async function updateSystemConfig(config: Partial<SystemConfig>): Promise<boolean> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  try {
    const admin = await prisma.admin.findFirst({
      where: { userId: session.user.id }
    })
    if (!admin) throw new Error('Not an admin')

    const updates = Object.entries(config).map(([key, value]) => 
      prisma.config.upsert({
        where: { key: `system.${key}` },
        update: { value },
        create: {
          key: `system.${key}`,
          value,
          description: `System ${key}`
        }
      })
    )

    await prisma.$transaction(updates)

    // Invalidate all system config cache keys
    await cache.invalidatePattern(`${CONFIG_CACHE_PREFIX}system.*`)

    revalidatePath('/admin/settings')
    return true
  } catch (error) {
    console.error('Error updating system config:', error)
    return false
  }
}

