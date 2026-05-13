'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  getCurrentUser,
  isAllowedAdminEmail,
  supabaseAuthConfigured,
} from '@/lib/auth/admin'
import { runCveSync, runKevSync } from '@/lib/sync/runners'
import type { SyncResult } from '@/types/intel'

export interface LoginActionState {
  error: string | null
}

export async function loginAction(
  _prev: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  if (!supabaseAuthConfigured()) {
    return {
      error:
        'Supabase is not configured on this deployment. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    }
  }

  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  if (!isAllowedAdminEmail(email)) {
    return { error: 'This account is not permitted to access the admin panel.' }
  }

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) {
    return { error: error.message }
  }
  if (!data.user) {
    return { error: 'Login failed  no session returned.' }
  }
  if (!isAllowedAdminEmail(data.user.email ?? null)) {
    // Shouldn't hit this path (email mismatch) but guard anyway.
    await supabase.auth.signOut()
    return { error: 'This account is not permitted to access the admin panel.' }
  }

  redirect('/admin')
}

/**
 * Force-refresh the Supabase access-token JWT (calls refreshSession with
 * the existing refresh_token cookie). Returns a small JSON payload the
 * inspector page can show without dumping the full token state.
 */
export async function refreshSessionAction(): Promise<{
  ok: boolean
  error?: string
  expiresAt?: number | null
}> {
  if (!supabaseAuthConfigured()) {
    return { ok: false, error: 'Supabase auth is not configured.' }
  }
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.refreshSession()
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin/session')
    return { ok: true, expiresAt: data.session?.expires_at ?? null }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Refresh failed.',
    }
  }
}

export async function logoutAction(): Promise<void> {
  if (supabaseAuthConfigured()) {
    try {
      const supabase = await createServerSupabaseClient()
      await supabase.auth.signOut()
    } catch {
      /* no-op */
    }
  }
  redirect('/admin/login')
}

export type TriggerSyncState =
  | { status: 'idle' }
  | { status: 'success'; result: SyncResult }
  | { status: 'error'; message: string }

async function requireAdminForAction(): Promise<string | null> {
  const user = await getCurrentUser()
  if (!user) return 'Not authenticated.'
  if (!isAllowedAdminEmail(user.email ?? null)) {
    return 'This account is not permitted to run admin actions.'
  }
  return null
}

export async function triggerCveSyncAction(
  _prev: TriggerSyncState,
): Promise<TriggerSyncState> {
  const authError = await requireAdminForAction()
  if (authError) return { status: 'error', message: authError }

  const outcome = await runCveSync()
  if (!outcome.ok) {
    return { status: 'error', message: outcome.error.message }
  }
  revalidatePath('/admin')
  revalidatePath('/')
  revalidatePath('/intelligence')
  return { status: 'success', result: outcome.result }
}

export async function triggerKevSyncAction(
  _prev: TriggerSyncState,
): Promise<TriggerSyncState> {
  const authError = await requireAdminForAction()
  if (authError) return { status: 'error', message: authError }

  const outcome = await runKevSync()
  if (!outcome.ok) {
    return { status: 'error', message: outcome.error.message }
  }
  revalidatePath('/admin')
  revalidatePath('/')
  revalidatePath('/intelligence')
  return { status: 'success', result: outcome.result }
}
