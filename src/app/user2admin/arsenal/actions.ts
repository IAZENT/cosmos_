'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser, isAllowedAdminEmail } from '@/lib/auth/admin'
import {
  ARSENAL_CATEGORIES,
  ARSENAL_DIFFICULTIES,
  ARSENAL_PLATFORMS,
  ARSENAL_USE_CASES,
} from '@/lib/arsenal/constants'

async function requireAdmin(): Promise<string | null> {
  const user = await getCurrentUser()
  if (!user) return 'Not authenticated.'
  if (!isAllowedAdminEmail(user.email ?? null)) {
    return 'This account is not permitted to run admin actions.'
  }
  return null
}

function parseCsvList(raw: FormDataEntryValue | null, max = 32): string[] {
  if (typeof raw !== 'string' || !raw.trim()) return []
  return raw
    .split(/[,\n]/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .slice(0, max)
}

const arsenalSchema = z.object({
  title: z.string().trim().min(1).max(200),
  command: z.string().trim().min(1).max(8000),
  description: z.string().trim().max(2000).optional().default(''),
  category: z.enum(ARSENAL_CATEGORIES),
  subcategory: z.string().trim().max(80).optional().default(''),
  tags: z.array(z.string().trim().min(1).max(48)).max(32),
  platform: z.array(z.enum(ARSENAL_PLATFORMS)).max(4),
  difficulty: z.enum(ARSENAL_DIFFICULTIES),
  mitre_id: z.string().trim().max(40).optional().default(''),
  mitre_name: z.string().trim().max(200).optional().default(''),
  note: z.string().trim().max(2000).optional().default(''),
  source_url: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .default('')
    .refine(
      (v) => !v || /^https?:\/\//i.test(v),
      'source_url must be http(s) URL',
    ),
  use_case: z.enum(ARSENAL_USE_CASES),
  published: z.boolean(),
  pinned: z.boolean(),
})

export interface ArsenalFormState {
  error: string | null
  ok?: boolean
}

function parseForm(form: FormData) {
  const platformVals = form.getAll('platform').filter((v) => typeof v === 'string') as string[]
  return arsenalSchema.safeParse({
    title: form.get('title'),
    command: form.get('command'),
    description: form.get('description') ?? '',
    category: form.get('category'),
    subcategory: form.get('subcategory') ?? '',
    tags: parseCsvList(form.get('tags')),
    platform: platformVals,
    difficulty: form.get('difficulty'),
    mitre_id: form.get('mitre_id') ?? '',
    mitre_name: form.get('mitre_name') ?? '',
    note: form.get('note') ?? '',
    source_url: form.get('source_url') ?? '',
    use_case: form.get('use_case'),
    published: form.get('published') === 'on',
    pinned: form.get('pinned') === 'on',
  })
}

function payload(data: z.infer<typeof arsenalSchema>) {
  return {
    title: data.title,
    command: data.command,
    description: data.description || null,
    category: data.category,
    subcategory: data.subcategory || null,
    tags: data.tags,
    platform: data.platform,
    difficulty: data.difficulty,
    mitre_id: data.mitre_id || null,
    mitre_name: data.mitre_name || null,
    note: data.note || null,
    source_url: data.source_url || null,
    use_case: data.use_case,
    published: data.published,
    pinned: data.pinned,
  }
}

export async function createArsenalAction(
  _prev: ArsenalFormState,
  form: FormData,
): Promise<ArsenalFormState> {
  const authErr = await requireAdmin()
  if (authErr) return { error: authErr }
  const parsed = parseForm(form)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return {
      error: first
        ? `${first.path.join('.')}: ${first.message}`
        : 'Invalid input.',
    }
  }
  try {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from('arsenal_entries')
      .insert(payload(parsed.data))
    if (error) return { error: error.message }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'unknown error' }
  }
  revalidatePath('/arsenal')
  revalidatePath('/user2admin/arsenal')
  redirect('/user2admin/arsenal')
}

export async function updateArsenalAction(
  id: string,
  _prev: ArsenalFormState,
  form: FormData,
): Promise<ArsenalFormState> {
  const authErr = await requireAdmin()
  if (authErr) return { error: authErr }
  const parsed = parseForm(form)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return {
      error: first
        ? `${first.path.join('.')}: ${first.message}`
        : 'Invalid input.',
    }
  }
  try {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from('arsenal_entries')
      .update({ ...payload(parsed.data), updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return { error: error.message }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'unknown error' }
  }
  revalidatePath('/arsenal')
  revalidatePath('/user2admin/arsenal')
  redirect('/user2admin/arsenal')
}

export async function deleteArsenalAction(id: string): Promise<void> {
  const authErr = await requireAdmin()
  if (authErr) return
  try {
    const supabase = await createServerSupabaseClient()
    await supabase.from('arsenal_entries').delete().eq('id', id)
  } catch {
    /* swallow */
  }
  revalidatePath('/arsenal')
  revalidatePath('/user2admin/arsenal')
}

export async function togglePublishedArsenalAction(
  id: string,
  next: boolean,
): Promise<void> {
  const authErr = await requireAdmin()
  if (authErr) return
  try {
    const supabase = await createServerSupabaseClient()
    await supabase
      .from('arsenal_entries')
      .update({ published: next, updated_at: new Date().toISOString() })
      .eq('id', id)
  } catch {
    /* swallow */
  }
  revalidatePath('/arsenal')
  revalidatePath('/user2admin/arsenal')
}

export async function togglePinnedArsenalAction(
  id: string,
  next: boolean,
): Promise<void> {
  const authErr = await requireAdmin()
  if (authErr) return
  try {
    const supabase = await createServerSupabaseClient()
    await supabase
      .from('arsenal_entries')
      .update({ pinned: next, updated_at: new Date().toISOString() })
      .eq('id', id)
  } catch {
    /* swallow */
  }
  revalidatePath('/arsenal')
  revalidatePath('/user2admin/arsenal')
}
