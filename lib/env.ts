// Environment variable types
type EnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  PAYSTACK_SECRET_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
  NEXT_PUBLIC_APP_URL: string
}

// Environment variable validation
export const env: EnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY || "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
}

// Validate environment variables
export function validateEnv() {
  const isServer = typeof window === "undefined"
  const isDev = process.env.NODE_ENV !== "production"

  // Only validate on server in development
  if (!isServer || !isDev) return

  const requiredVars: Record<keyof EnvVars, string> = {
    NEXT_PUBLIC_SUPABASE_URL: "Supabase project URL",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "Supabase anonymous key",
    PAYSTACK_SECRET_KEY: "Paystack secret key",
    SUPABASE_SERVICE_ROLE_KEY: "Supabase service role key",
    NEXT_PUBLIC_APP_URL: "Application URL",
  }

  const missingVars = Object.entries(requiredVars).filter(([key]) => !env[key as keyof EnvVars])

  if (missingVars.length > 0) {
    const missingVarsList = missingVars
      .map(([key, desc]) => `\n  - ${key}: ${desc}`)
      .join("")
      
    throw new Error(
      `Missing required environment variables:${missingVarsList}\n\nMake sure these are set in your .env file or in your deployment environment.`
    )
  }
}

