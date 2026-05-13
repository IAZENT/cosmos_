'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser, isAllowedAdminEmail } from '@/lib/auth/admin'

/* ------------------------------------------------------------------ */
/* Shared auth guard                                                  */
/* ------------------------------------------------------------------ */

async function requireAdmin(): Promise<string | null> {
  const user = await getCurrentUser()
  if (!user) return 'Not authenticated.'
  if (!isAllowedAdminEmail(user.email ?? null)) {
    return 'This account is not permitted to run admin actions.'
  }
  return null
}

function parseTags(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== 'string' || !raw.trim()) return []
  return raw
    .split(/[,\n]/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .slice(0, 32)
}

/* ------------------------------------------------------------------ */
/* Resources                                                          */
/* ------------------------------------------------------------------ */

const resourceSchema = z.object({
  title: z.string().trim().min(1).max(200),
  url: z.string().trim().url().max(2000),
  description: z.string().trim().max(2000).optional().default(''),
  category: z.string().trim().max(80).optional().default(''),
  tags: z.array(z.string().trim().min(1).max(48)).max(32),
  trust_rating: z
    .number()
    .int()
    .min(1)
    .max(5)
    .nullable(),
  personal_note: z.string().trim().max(1000).optional().default(''),
  published: z.boolean(),
})

export interface ResourceFormState {
  error: string | null
  ok?: boolean
}

function parseResourceForm(form: FormData) {
  const trust = form.get('trust_rating')
  const trustNum =
    typeof trust === 'string' && trust.length > 0 ? Number(trust) : NaN
  return resourceSchema.safeParse({
    title: form.get('title'),
    url: form.get('url'),
    description: form.get('description') ?? '',
    category: form.get('category') ?? '',
    tags: parseTags(form.get('tags')),
    trust_rating: Number.isFinite(trustNum) ? trustNum : null,
    personal_note: form.get('personal_note') ?? '',
    published: form.get('published') === 'on',
  })
}

export async function createResourceAction(
  _prev: ResourceFormState,
  form: FormData,
): Promise<ResourceFormState> {
  const authErr = await requireAdmin()
  if (authErr) return { error: authErr }

  const parsed = parseResourceForm(form)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { error: first ? `${first.path.join('.')}: ${first.message}` : 'Invalid input.' }
  }

  try {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.from('resources').insert({
      title: parsed.data.title,
      url: parsed.data.url,
      description: parsed.data.description || null,
      category: parsed.data.category || null,
      tags: parsed.data.tags,
      trust_rating: parsed.data.trust_rating,
      personal_note: parsed.data.personal_note || null,
      published: parsed.data.published,
    })
    if (error) return { error: error.message }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'unknown error' }
  }

  revalidatePath('/resources')
  revalidatePath('/user2admin/resources')
  redirect('/user2admin/resources')
}

export async function updateResourceAction(
  id: string,
  _prev: ResourceFormState,
  form: FormData,
): Promise<ResourceFormState> {
  const authErr = await requireAdmin()
  if (authErr) return { error: authErr }
  const parsed = parseResourceForm(form)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { error: first ? `${first.path.join('.')}: ${first.message}` : 'Invalid input.' }
  }
  try {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from('resources')
      .update({
        title: parsed.data.title,
        url: parsed.data.url,
        description: parsed.data.description || null,
        category: parsed.data.category || null,
        tags: parsed.data.tags,
        trust_rating: parsed.data.trust_rating,
        personal_note: parsed.data.personal_note || null,
        published: parsed.data.published,
      })
      .eq('id', id)
    if (error) return { error: error.message }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'unknown error' }
  }
  revalidatePath('/resources')
  revalidatePath('/user2admin/resources')
  redirect('/user2admin/resources')
}

export async function deleteResourceAction(id: string): Promise<void> {
  const authErr = await requireAdmin()
  if (authErr) return
  try {
    const supabase = await createServerSupabaseClient()
    await supabase.from('resources').delete().eq('id', id)
  } catch {
    /* swallow  admin sees refresh with stale row if this failed */
  }
  revalidatePath('/resources')
  revalidatePath('/user2admin/resources')
}

export async function publishResourceAction(id: string): Promise<void> {
  const authErr = await requireAdmin()
  if (authErr) return
  try {
    const supabase = await createServerSupabaseClient()
    await supabase
      .from('resources')
      .update({ published: true })
      .eq('id', id)
  } catch {
    /* swallow */
  }
  revalidatePath('/resources')
  revalidatePath('/user2admin/resources')
}

/* ------------------------------------------------------------------ */
/* Public submit-a-resource (no auth  saves as unpublished draft)    */
/* ------------------------------------------------------------------ */

const publicResourceSchema = z.object({
  title: z.string().trim().min(2).max(200),
  url: z.string().trim().url().max(2000),
  description: z.string().trim().max(2000).optional().default(''),
  category: z.string().trim().max(80).optional().default(''),
  tags: z.array(z.string().trim().min(1).max(48)).max(10),
  submitter_note: z.string().trim().max(500).optional().default(''),
  honeypot: z.string().optional().default(''),
})

export interface PublicSubmitState {
  error: string | null
  ok?: boolean
}

export async function submitResourceAction(
  _prev: PublicSubmitState,
  form: FormData,
): Promise<PublicSubmitState> {
  const parsed = publicResourceSchema.safeParse({
    title: form.get('title'),
    url: form.get('url'),
    description: form.get('description') ?? '',
    category: form.get('category') ?? '',
    tags: parseTags(form.get('tags')),
    submitter_note: form.get('submitter_note') ?? '',
    honeypot: form.get('website') ?? '',
  })
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return {
      error: first
        ? `${first.path.join('.')}: ${first.message}`
        : 'Invalid input.',
    }
  }
  // Honeypot field named "website"  bots often fill every input, but a
  // human won't see this one. Drop silently.
  if (parsed.data.honeypot) {
    return { error: null, ok: true }
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return {
      error: 'Submissions are not accepting right now. Try again later.',
    }
  }

  try {
    // The `resources_public_submit` RLS policy (migration
    // 0004_public_resource_submit.sql) grants anon INSERT *only* when
    // `published = false`. That's exactly what we're doing here, so the
    // anon-key client is the right fit  no service-role bypass needed.
    // If submissions return a "schema cache" / "table not found" error,
    // that migration hasn't been applied yet.
    const supabase = await createServerSupabaseClient()
    const note = parsed.data.submitter_note
      ? `[submitted via public form] ${parsed.data.submitter_note}`
      : '[submitted via public form]'
    const { error } = await supabase.from('resources').insert({
      title: parsed.data.title,
      url: parsed.data.url,
      description: parsed.data.description || null,
      category: parsed.data.category || null,
      tags: parsed.data.tags,
      trust_rating: null,
      personal_note: note,
      published: false,
    })
    if (error) {
      // PostgREST returns this when the table doesn't exist or its schema
      // cache hasn't reloaded after a migration. Both cases are operator
      // problems, not user input  surface a clear, actionable message.
      const msg = error.message ?? ''
      if (
        /schema cache/i.test(msg) ||
        /relation .*resources.* does not exist/i.test(msg) ||
        error.code === 'PGRST205' ||
        error.code === '42P01'
      ) {
        return {
          error:
            'Resource submissions are temporarily unavailable. The administrator needs to apply database migrations (supabase/migrations/0001_initial_schema.sql) or reload the PostgREST schema cache.',
        }
      }
      return { error: msg || 'Submission failed.' }
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'unknown error' }
  }

  revalidatePath('/user2admin/resources')
  return { error: null, ok: true }
}

/* ------------------------------------------------------------------ */
/* Research posts                                                     */
/* ------------------------------------------------------------------ */

const slugRegex = /^[a-z0-9][a-z0-9-]*$/
const postSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(slugRegex, 'slug must be kebab-case (a-z, 0-9, dashes)'),
  title: z.string().trim().min(1).max(200),
  summary: z.string().trim().max(500).optional().default(''),
  content: z.string().max(200_000).optional().default(''),
  category: z.string().trim().max(80).optional().default(''),
  tags: z.array(z.string().trim().min(1).max(48)).max(32),
  mitre_techniques: z.array(z.string().trim().min(1).max(48)).max(64),
  published: z.boolean(),
})

export interface PostFormState {
  error: string | null
  ok?: boolean
}

function parsePostForm(form: FormData) {
  return postSchema.safeParse({
    slug: form.get('slug'),
    title: form.get('title'),
    summary: form.get('summary') ?? '',
    content: form.get('content') ?? '',
    category: form.get('category') ?? '',
    tags: parseTags(form.get('tags')),
    mitre_techniques: parseTags(form.get('mitre_techniques')),
    published: form.get('published') === 'on',
  })
}

export async function createResearchAction(
  _prev: PostFormState,
  form: FormData,
): Promise<PostFormState> {
  const authErr = await requireAdmin()
  if (authErr) return { error: authErr }
  const parsed = parsePostForm(form)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { error: first ? `${first.path.join('.')}: ${first.message}` : 'Invalid input.' }
  }
  const nowIso = new Date().toISOString()
  try {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.from('research_posts').insert({
      slug: parsed.data.slug,
      title: parsed.data.title,
      summary: parsed.data.summary || null,
      content: parsed.data.content || null,
      category: parsed.data.category || null,
      tags: parsed.data.tags,
      mitre_techniques: parsed.data.mitre_techniques,
      published: parsed.data.published,
      published_at: parsed.data.published ? nowIso : null,
    })
    if (error) return { error: error.message }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'unknown error' }
  }
  revalidatePath('/research')
  revalidatePath(`/research/${parsed.data.slug}`)
  revalidatePath('/user2admin/research')
  redirect('/user2admin/research')
}

export async function updateResearchAction(
  id: string,
  _prev: PostFormState,
  form: FormData,
): Promise<PostFormState> {
  const authErr = await requireAdmin()
  if (authErr) return { error: authErr }
  const parsed = parsePostForm(form)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { error: first ? `${first.path.join('.')}: ${first.message}` : 'Invalid input.' }
  }
  try {
    const supabase = await createServerSupabaseClient()
    // Preserve published_at when the post was already published.
    const { data: existing } = await supabase
      .from('research_posts')
      .select('published, published_at')
      .eq('id', id)
      .maybeSingle()
    const wasPublished = Boolean(existing?.published)
    const publishedAt = parsed.data.published
      ? existing?.published_at ?? new Date().toISOString()
      : wasPublished
        ? existing?.published_at ?? null
        : null
    const { error } = await supabase
      .from('research_posts')
      .update({
        slug: parsed.data.slug,
        title: parsed.data.title,
        summary: parsed.data.summary || null,
        content: parsed.data.content || null,
        category: parsed.data.category || null,
        tags: parsed.data.tags,
        mitre_techniques: parsed.data.mitre_techniques,
        published: parsed.data.published,
        published_at: publishedAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    if (error) return { error: error.message }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'unknown error' }
  }
  revalidatePath('/research')
  revalidatePath(`/research/${parsed.data.slug}`)
  revalidatePath('/user2admin/research')
  redirect('/user2admin/research')
}

export async function deleteResearchAction(id: string): Promise<void> {
  const authErr = await requireAdmin()
  if (authErr) return
  try {
    const supabase = await createServerSupabaseClient()
    await supabase.from('research_posts').delete().eq('id', id)
  } catch {
    /* swallow */
  }
  revalidatePath('/research')
  revalidatePath('/user2admin/research')
}
