import { Redis } from 'ioredis'
import { env } from './env'

// Create a mock Redis implementation for when Redis is not available
class MockRedis {
  private storage: Map<string, string>

  constructor() {
    this.storage = new Map()
  }

  async get(key: string) {
    return this.storage.get(key) || null
  }

  async set(key: string, value: string) {
    this.storage.set(key, value)
    return 'OK'
  }

  async setex(key: string, seconds: number, value: string) {
    this.storage.set(key, value)
    setTimeout(() => this.storage.delete(key), seconds * 1000)
    return 'OK'
  }

  async del(...keys: string[]) {
    keys.forEach(key => this.storage.delete(key))
    return keys.length
  }

  async keys(pattern: string) {
    return Array.from(this.storage.keys()).filter(key => key.includes(pattern))
  }

  async flushall() {
    this.storage.clear()
    return 'OK'
  }

  async ping() {
    return 'PONG'
  }
}

// Try to create Redis client, fallback to mock if it fails
const createRedisClient = () => {
  if (process.env.NODE_ENV === 'development' && !env.REDIS_HOST) {
    console.log('Redis not configured, using in-memory cache')
    return new MockRedis() as unknown as Redis
  }

  const client = new Redis({
    host: env.REDIS_HOST || 'localhost',
    port: parseInt(env.REDIS_PORT || '6379'),
    password: env.REDIS_PASSWORD,
    retryStrategy: (times) => {
      if (times > 3) {
        console.warn('Redis connection failed, falling back to in-memory cache')
        return null // Stop retrying
      }
      const delay = Math.min(times * 50, 2000)
      return delay
    },
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false,
    lazyConnect: true, // Don't connect immediately
  })

  client.on('error', (error) => {
    if (!error.message.includes('ECONNREFUSED')) {
      console.error('Redis error:', error)
    }
  })

  return client
}

export class CacheService {
  private static instance: CacheService
  private redis: Redis | MockRedis

  private constructor() {
    this.redis = createRedisClient()
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService()
    }
    return CacheService.instance
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key)
      if (!value) return null
      return JSON.parse(value)
    } catch (error) {
      console.warn('Cache get failed:', error)
      return null
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value)
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, serialized)
      } else {
        await this.redis.set(key, serialized)
      }
    } catch (error) {
      console.warn('Cache set failed:', error)
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key)
    } catch (error) {
      console.warn('Cache delete failed:', error)
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern)
      if (keys.length > 0) {
        await this.redis.del(...keys)
      }
    } catch (error) {
      console.warn('Cache invalidate pattern failed:', error)
    }
  }

  // Cache wrapper for database queries
  async cached<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number = 300 // 5 minutes default
  ): Promise<T> {
    try {
      const cached = await this.get<T>(key)
      if (cached) return cached

      const fresh = await fetchFn()
      await this.set(key, fresh, ttlSeconds)
      return fresh
    } catch (error) {
      console.warn('Cache wrapper failed:', error)
      return fetchFn() // Fallback to direct fetch if cache fails
    }
  }

  // Clear all cache
  async flush(): Promise<void> {
    try {
      await this.redis.flushall()
    } catch (error) {
      console.warn('Cache flush failed:', error)
    }
  }

  // Health check
  async ping(): Promise<boolean> {
    try {
      const result = await this.redis.ping()
      return result === 'PONG'
    } catch {
      return false
    }
  }
}