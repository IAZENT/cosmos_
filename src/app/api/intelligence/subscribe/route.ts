import { NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { buildVerifyEmail } from '@/lib/email/templates'
import {
  savedSearchFiltersSchema,
  parseFilters,
} from '@/lib/intel/saved-search-match'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  label: z.string().trim().max(80).optional().default(''),
  filters: savedSearchFiltersSchema,
})

/* ------------------------------------------------------------------ *
 * Light in-process rate limit. Per-instance only  good enough for v1
 * to slow drive-by signup spam, not a hard guarantee. Resets on cold
 * start. Replace with Upstash/Redis if we ever care about precise
 * accounting across regions.
 * ------------------------------------------------------------------ */
const HITS = new Map<string, { count: number; firstHitMs: number }>()
const WINDOW_MS = 60 * 60 * 1000
const MAX_PER_WINDOW = 3
function rateLimit(ip: string): { ok: boolean; retryAfterSec: number } {
  const now = Date.now()
  const entry = HITS.get(ip)
  if (!entry || now - entry.firstHitMs > WINDOW_MS) {
    HITS.set(ip, { count: 1, firstHitMs: now })
    return { ok: true, retryAfterSec: 0 }
  }
  entry.count += 1
  if (entry.count > MAX_PER_WINDOW) {
    return {
      ok: false,
      retryAfterSec: Math.ceil(
        (entry.firstHitMs + WINDOW_MS - now) / 1000,
      ),
    }
  }
  return { ok: true, retryAfterSec: 0 }
}

function ipOf(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]?.trim() ?? 'unknown'
  return request.headers.get('x-real-ip')?.trim() || 'unknown'
}

function randomToken(): string {
  return randomBytes(24).toString('hex')
}

export async function POST(request: Request) {
  const ip = ipOf(request)
  const rl = rateLimit(ip)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests, try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfterSec) },
      },
    )
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const { email, label, filters } = parsed.data

  let supabase
  try {
    supabase = createServiceRoleClient()
  } catch {
    return NextResponse.json(
      { error: 'Subscriptions are disabled (service role not configured).' },
      { status: 503 },
    )
  }

  // Cap subscriptions per email to prevent a single inbox being used
  // as an enumeration / abuse vector. Hard cap is generous (20) since
  // legitimate users may want many narrow watches.
  const { count: existingCount } = await supabase
    .from('saved_searches')
    .select('id', { count: 'exact', head: true })
    .eq('email', email)
  if ((existingCount ?? 0) >= 20) {
    return NextResponse.json(
      {
        error:
          'You already have the maximum number of saved searches for this email.',
      },
      { status: 409 },
    )
  }

  const verifyToken = randomToken()
  const unsubToken = randomToken()
  const { error: insertErr } = await supabase
    .from('saved_searches')
    .insert({
      email,
      label: label || null,
      filters,
      verification_token: verifyToken,
      unsubscribe_token: unsubToken,
    })
  if (insertErr) {
    return NextResponse.json(
      { error: `db error: ${insertErr.message}` },
      { status: 500 },
    )
  }

  const mail = buildVerifyEmail({
    filters: parseFilters(filters),
    label: label || null,
    verifyToken,
  })
  const sent = await sendEmail({
    to: email,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  })
  if (!sent.ok) {
    // The row exists but the user can't confirm. Surface a soft
    // failure so the UI can apologise; the verification token is
    // still valid if we add a "resend" affordance later.
    return NextResponse.json(
      {
        ok: false,
        error: `Subscription saved but verification email failed: ${sent.error ?? 'unknown'}`,
      },
      { status: 502 },
    )
  }

  return NextResponse.json({
    ok: true,
    status: sent.loggedOnly ? 'verification-logged' : 'verification-sent',
    message:
      'Check your inbox to confirm the subscription. The link expires in 30 days.',
  })
}
