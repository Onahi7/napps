import { PrismaClient, Prisma, UserRole, PaymentStatus, AccredStatus } from '@prisma/client'
import { CacheService } from './cache'

export class PrismaService {
  private static instance: PrismaService
  private prisma: PrismaClient
  private cache: CacheService

  private constructor() {
    this.prisma = new PrismaClient({
      log: ['error', 'warn'],
      errorFormat: 'minimal',
    })
    this.cache = CacheService.getInstance()
  }

  public static getInstance(): PrismaService {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService()
    }
    return PrismaService.instance
  }

  async searchProfiles(query: string, options: {
    limit?: number
    offset?: number
    role?: UserRole
    paymentStatus?: PaymentStatus
    accreditationStatus?: AccredStatus
  } = {}) {
    const {
      limit = 10,
      offset = 0,
      role,
      paymentStatus,
    } = options

    const cacheKey = `search:${query}:${JSON.stringify(options)}`
    const cached = await this.cache.get(cacheKey)
    if (cached) return cached

    const where: Prisma.ParticipantWhereInput = {
      OR: [
        { user: { fullName: { contains: query, mode: 'insensitive' as Prisma.QueryMode } } },
        { user: { email: { contains: query, mode: 'insensitive' as Prisma.QueryMode } } },
        { user: { phone: { contains: query } } },
        { organization: { contains: query, mode: 'insensitive' as Prisma.QueryMode } },
        { chapter: { contains: query, mode: 'insensitive' as Prisma.QueryMode } }
      ],
      ...(role && { user: { role } }),
      ...(paymentStatus && { paymentStatus })
    }

    const participants = await this.prisma.participant.findMany({
      where,
      take: limit,
      skip: offset,
      include: {
        user: true
      }
    })

    await this.cache.set(cacheKey, participants, 300) // Cache for 5 minutes
    return participants
  }

  // Transaction helper with proper typing
  async transaction<T>(fn: (prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn)
  }

  // Graceful shutdown
  async shutdown() {
    await this.prisma.$disconnect()
  }

  // Health check
  async checkHealth(): Promise<Record<string, any>> {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      const cacheHealth = await this.cache.ping()

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        prismaConnected: true,
        redisConnected: cacheHealth
      }
    } catch (error: any) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        prismaConnected: false,
        redisConnected: false
      }
    }
  }

  // Expose Prisma client for direct access when needed
  get client() {
    return this.prisma
  }
}