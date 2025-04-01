import { z } from 'zod'

export const envSchema = z.object({
  // Database
  DATABASE_URL: z.string(),
  DATABASE_SSL: z.coerce.boolean().default(true),
  
  // Redis
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_USERNAME: z.string().optional(),
  
  // Auth
  NEXTAUTH_SECRET: z.string(),
  NEXTAUTH_URL: z.string(),
  NEXT_PUBLIC_APP_URL: z.string(),
  
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),
  
  // Paystack
  PAYSTACK_SECRET_KEY: z.string(),
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: z.string(),
})

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_SSL: process.env.DATABASE_SSL === 'true',
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  REDIS_USERNAME: process.env.REDIS_USERNAME,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
})

