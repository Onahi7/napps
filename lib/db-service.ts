import { PrismaClient } from '@prisma/client'
import { CacheService } from './cache'

export class DatabaseService {
  private static instance: DatabaseService
  private prisma: PrismaClient
  private cache: CacheService

  private constructor() {
    this.prisma = new PrismaClient()
    this.cache = CacheService.getInstance()
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  // Search participants with filtering
  async searchProfiles(query: string, options: {
    limit?: number
    offset?: number
    role?: string
    paymentStatus?: string
    accreditationStatus?: string
  } = {}): Promise<any[]> {
    const {
      limit = 10,
      offset = 0,
      role,
      paymentStatus,
      accreditationStatus
    } = options

    const cacheKey = `search:${query}:${JSON.stringify(options)}`
    const cached = await this.cache.get(cacheKey)
    if (cached) return cached as any[]

    // Build where conditions for Prisma
    const whereConditions: any = {
      OR: [
        { user: { fullName: { contains: query, mode: 'insensitive' } } },
        { user: { email: { contains: query, mode: 'insensitive' } } },
        { organization: { contains: query, mode: 'insensitive' } },
        { state: { contains: query, mode: 'insensitive' } },
        { chapter: { contains: query, mode: 'insensitive' } }
      ]
    }

    if (role) {
      whereConditions.user = { ...whereConditions.user, role }
    }
    if (paymentStatus) {
      whereConditions.paymentStatus = paymentStatus
    }
    if (accreditationStatus) {
      whereConditions.accreditationStatus = accreditationStatus
    }

    const results = await this.prisma.participant.findMany({
      where: whereConditions,
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            role: true
          }
        }
      },
      take: limit,
      skip: offset,
      orderBy: {
        user: {
          fullName: 'asc'
        }
      }
    })

    await this.cache.set(cacheKey, results, 300) // Cache for 5 minutes
    return results
  }

  // Batch processing helper with cursor
  async processBatch<T>(
    batchSize: number,
    processFn: (items: T[]) => Promise<void>,
    query: {
      where?: any
      orderBy?: any
      select?: any
      include?: any
    }
  ): Promise<void> {
    let cursor: any = undefined
    
    while (true) {
      const batch = await this.prisma.participant.findMany({
        ...query,
        take: batchSize,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined
      })

      if (batch.length === 0) break

      await processFn(batch as T[])
      cursor = batch[batch.length - 1].id
    }
  }

  // Upsert helper with proper typing
  async upsert<T>(
    model: keyof Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
    data: {
      create: any
      update: any
      where: any
    }
  ): Promise<T> {
    const prismaModel = this.prisma[model] as any
    if (typeof prismaModel.upsert !== 'function') {
      throw new Error(`Upsert operation not supported on model ${String(model)}`)
    }
    return prismaModel.upsert(data) as Promise<T>
  }
}