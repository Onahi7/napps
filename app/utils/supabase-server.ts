'use server'

import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import type { CookieOptions } from '@supabase/ssr'
import { env } from '@/lib/env'
import type { Database } from '@/lib/database.types'

// Create a supabase client for server-side usage (server actions and API routes)
export const createClientServer = async (): Promise<ReturnType<typeof createServerClient<Database>>> => {
  const requestHeaders = await headers()
  const cookies = requestHeaders.get('cookie') ?? ''
  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          const cookie = cookies.split(';').find((c: string) => c.trim().startsWith(`${name}=`))
          return cookie ? cookie.split('=')[1] : ''
        }
      }
    }
  )
}

// Create a supabase admin client with service role
export const createAdminClient = async () => {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
  }
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    }
  )
}