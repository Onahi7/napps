import { Prisma } from '@prisma/client'

// Helper type to convert enums to union types
type EnumToUnion<T> = T[keyof T]

// Auth and User types
export type UserRole = 'PARTICIPANT' | 'VALIDATOR' | 'ADMIN'

export interface User {
  id: string
  email: string
  password: string
  fullName: string
  phone: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
  participant?: Participant
  validator?: Validator
  admin?: Admin
}

// Participant types
export type PaymentStatus = 'PENDING' | 'PROOF_SUBMITTED' | 'COMPLETED'
export type AccredStatus = 'PENDING' | 'COMPLETED' | 'DECLINED'

export interface Participant {
  id: string
  userId: string
  user: User
  state: string
  lga: string
  chapter?: string
  organization?: string
  position?: string
  paymentStatus: PaymentStatus
  paymentProof?: string
  paymentAmount?: number
  paymentDate?: Date
  accreditationStatus: AccredStatus
  accreditationDate?: Date
  qrCode?: string
  referenceCode?: string
  accommodation?: Accommodation
  resourceAccesses: ResourceAccess[]
  scans: Scan[]
  dietaryRequirements?: string
}

// Event types
export type EventType = 'SESSION' | 'BREAK' | 'REGISTRATION' | 'SPECIAL'

export interface ScheduleEvent {
  id: string
  title: string
  description?: string
  day: number
  startTime: string
  endTime: string
  venue?: string
  type: EventType
  speakers: string[]
}

// Resource types
export type ResourceType = 'DOCUMENT' | 'VIDEO' | 'PRESENTATION' | 'OTHER'
export type AccessType = 'VIEW' | 'DOWNLOAD'

export interface Resource {
  id: string
  title: string
  type: ResourceType
  url: string
  description?: string
  isPublic: boolean
  createdAt: Date
  accesses: ResourceAccess[]
}

export interface ResourceAccess {
  id: string
  participantId: string
  participant: Participant
  resourceId: string
  resource: Resource
  accessType: AccessType
  accessedAt: Date
}

// Accommodation types
export type PriceCategory = 'ECONOMY' | 'STANDARD' | 'PREMIUM'
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED'

export interface Hotel {
  id: string
  name: string
  description?: string
  address?: string
  pricePerNight: number
  priceCategory: PriceCategory
  imageUrl?: string
  availableRooms: number
  distanceFromVenue?: number
  rating?: number
  amenities: string[]
  contactPhone?: string
  contactWhatsapp?: string
  isFeatured: boolean
  createdAt: Date
  updatedAt: Date
  accommodations: Accommodation[]
}

export interface Accommodation {
  id: string
  participantId: string
  participant: Participant
  hotelId: string
  hotel: Hotel
  checkInDate: Date
  checkOutDate: Date
  bookingStatus: BookingStatus
  paymentStatus: PaymentStatus
  paymentReference?: string
  totalAmount: number
  createdAt: Date
  updatedAt: Date
}

// Validator and Admin types
export interface Validator {
  id: string
  userId: string
  user: User
  scans: Scan[]
  assignments: Assignment[]
}

export interface Admin {
  id: string
  userId: string
  user: User
}

// Scan and Assignment types
export type ScanType = 'CHECK_IN'
export type AssignmentStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'

export interface Scan {
  id: string
  participantId: string
  participant: Participant
  validatorId: string
  validator: Validator
  type: ScanType
  location?: string
  notes?: string
  scannedAt: Date
}

export interface Assignment {
  id: string
  validatorId: string
  validator: Validator
  location: string
  date: Date
  startTime: string
  endTime: string
  type: ScanType
  status: AssignmentStatus
}

// System Config type
export interface Config {
  id: string
  key: string
  value: any
  description?: string
  createdAt: Date
  updatedAt: Date
}

// Database monitoring types
export interface PoolState {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
}

export interface DbMetrics {
  totalQueries: number;
  prismaQueries: number;
  systemQueries: number;
  slowQueries: number;
  errors: number;
  openConnections: number;
  idleConnections: number;
  waitingQueries: number;
  lastError?: Error;
  lastErrorTime?: Date;
  prismaMetrics?: Record<string, any>;
}

export interface DatabaseHealth {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  postgresConnected: boolean;
  prismaConnected: boolean;
  redisConnected: boolean;
  error?: string;
  metrics?: DbMetrics;
}

// Prisma include types for common queries
export const ParticipantWithUser = Prisma.validator<Prisma.ParticipantDefaultArgs>()({
  include: { user: true }
})

export const ValidatorWithUser = Prisma.validator<Prisma.ValidatorDefaultArgs>()({
  include: { user: true }
})

export const HotelWithAccommodations = Prisma.validator<Prisma.HotelDefaultArgs>()({
  include: { accommodations: true }
})

export const ResourceWithAccesses = Prisma.validator<Prisma.ResourceDefaultArgs>()({
  include: { accesses: true }
})

// Type helpers
export type ParticipantWithUserType = Prisma.ParticipantGetPayload<typeof ParticipantWithUser>
export type ValidatorWithUserType = Prisma.ValidatorGetPayload<typeof ValidatorWithUser>
export type HotelWithAccommodationsType = Prisma.HotelGetPayload<typeof HotelWithAccommodations>
export type ResourceWithAccessesType = Prisma.ResourceGetPayload<typeof ResourceWithAccesses>
