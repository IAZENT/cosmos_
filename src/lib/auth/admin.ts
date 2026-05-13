import { cache } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Session, User } from '@supabase/supabase-js'

/**
 * Return the current Supabase user, or null if unauthenticated / unconfigured.
 *
 * Wrapped in React's `cache()` so multiple call sites in a single
 * request (admin page, action guard, layout) share one network
 * round-trip to Supabase's `/auth/v1/user`. Without this, a single
 * admin page render fires 4+ identical auth requests.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null
  }
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase.auth.getUser()
    return data.user ?? null
  } catch {
    return null
  }
})

/**
 * Return the full current Supabase session (access_token JWT,
 * refresh_token, expiry, user). Cached per-request for the same
 * reason as `getCurrentUser`. Returns null if no session is bound to
 * the request cookies.
 */
export const getCurrentSession = cache(async (): Promise<Session | null> => {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null
  }
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase.auth.getSession()
    return data.session ?? null
  } catch {
    return null
  }
})

/**
 * Gate an email against ADMIN_ALLOWED_EMAIL. When unset, any authenticated
 * user is accepted.
 */
export function isAllowedAdminEmail(email: string | null | undefined): boolean {
  const allowed = process.env.ADMIN_ALLOWED_EMAIL?.trim().toLowerCase()
  if (!allowed) return true
  return (email ?? '').trim().toLowerCase() === allowed
}

export function supabaseAuthConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}
