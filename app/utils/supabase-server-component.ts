'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { CookieOptions } from '@supabase/ssr'
import { env } from '@/lib/env'
import type { Database } from '@/lib/database.types'

// Create a supabase client for server components
export const createServerComponentClient = async () => {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value ?? ''
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({
            name,
            value,
            ...options,
            ...(options.maxAge && {
              expires: new Date(Date.now() + options.maxAge * 1000)
            })
          })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({
            name,
            ...options
          })
        }
      }
    }
  )
}