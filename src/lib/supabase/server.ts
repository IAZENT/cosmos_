import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

/**
 * Server-side Supabase client bound to request cookies.
 * Uses the anon key + RLS. Safe for user-scoped reads in RSC / Route Handlers.
 *
 * Next.js 15+ made `cookies()` async, so this helper is async too. All
 * call sites have been migrated to `await createServerSupabaseClient()`.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. See .env.example.',
    )
  }
  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {
          // no-op when called from a Server Component (cookies are read-only there).
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch {
          // no-op
        }
      },
    },
  })
}

/**
 * Privileged admin client using the service-role key.
 * MUST be invoked only from trusted server contexts (Route Handlers, server actions).
 * Bypasses RLS  never expose responses containing rows fetched via this client
 * without filtering.
 *
 * Uses `@supabase/supabase-js` `createClient` directly (not `@supabase/ssr`):
 * the ssr helper is designed for cookie-bound user sessions, and pairing it
 * with the service-role JWT can produce schema-cache / auth header
 * inconsistencies. This is the pattern Supabase documents for server-only
 * privileged work.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Service-role client requires server-only env.',
    )
  }
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'cosmos-platform/service-role',
      },
    },
  })
}
