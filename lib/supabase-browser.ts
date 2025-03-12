import { createBrowserClient } from '@supabase/ssr'
import { env } from '@/lib/env'
import type { Database } from '@/lib/database.types'

// Create a single instance for the browser client
let browserClient: ReturnType<typeof createBrowserClient> | null = null

// Create a supabase client for browser-side usage with automatic token refresh
export const createClientBrowser = () => {
  if (browserClient) return browserClient

  browserClient = createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      db: {
        schema: 'public'
      }
    }
  )

  return browserClient
}
