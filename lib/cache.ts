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
      const delay = Math.min(times * 50, 2000)
      return delay // Keep retrying with increasing delays
    },
    maxRetriesPerRequest: 5,
    enableOfflineQueue: true, // Enable offline queue
    lazyConnect: false, // Connect immediately
    reconnectOnError: (err) => {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        // Only reconnect if error includes READONLY
        return true;
      }
      return false;
    }
  })

  client.on('error', (error) => {
    console.error('Redis error:', error)
  })

  client.on('connect', () => {
    console.log('Redis connected successfully')
  })

  client.on('reconnecting', () => {
    console.log('Redis reconnecting...')
  })

  return client
}

export class CacheService {
  private static instance: CacheService
  private redis: Redis | MockRedis
  private connected: boolean = false

  private constructor() {
    this.redis = createRedisClient()
    this.initializeConnection()
  }

  private async initializeConnection() {
    try {
      if (this.redis instanceof Redis) {
        await this.redis.ping()
        this.connected = true
      }
    } catch (error) {
      console.error('Failed to initialize Redis connection:', error)
      this.connected = false
    }
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService()
    }
    return CacheService.instance
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.connected && this.redis instanceof Redis) {
        await this.initializeConnection()
      }
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
      const cachedData = await this.get<T>(key)
      if (cachedData) return cachedData
      
      const freshData = await fetchFn()
      await this.set(key, freshData, ttlSeconds)
      return freshData
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Cache error:', error.message)
      // On cache error, bypass cache and fetch directly
      return fetchFn()
    }
  }

  // Clear all cache
  async flush(): Promise<void> {
    try {
      await this.redis.flushall()
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Error flushing cache:', error.message)
    }
  }

  // Health check
  async ping(): Promise<boolean> {
    try {
      const result = await this.redis.ping()
      return result === 'PONG'
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Redis ping error:', error.message)
      return false
    }
  }

  // Cleanup Redis connection
  async close(): Promise<void> {
    try {
      if (this.redis instanceof Redis) {
        await this.redis.quit()
      }
      this.connected = false
    } catch (error) {
      console.error('Error closing Redis connection:', error)
    }
  }
}