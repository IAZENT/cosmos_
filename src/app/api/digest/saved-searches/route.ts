import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { buildDigestEmail } from '@/lib/email/templates'
import {
  matchSavedSearch,
  parseFilters,
} from '@/lib/intel/saved-search-match'
import type { SavedSearchDBRow } from '@/types/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const DIGEST_DEFAULT_LOOKBACK_DAYS = 7
const MAX_ITEMS_PER_DIGEST = 25

function isAuthorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET?.trim()
  if (!expected) return false
  // Vercel cron sets `authorization: Bearer …`; GitHub Actions does the
  // same. We also accept `?secret=…` for manual curling during testing.
  const header = request.headers.get('authorization')?.trim() ?? ''
  const url = new URL(request.url)
  const provided = header.startsWith('Bearer ')
    ? header.slice('Bearer '.length).trim()
    : url.searchParams.get('secret')?.trim() ?? ''

  if (!provided) return false
  const a = Buffer.from(expected)
  const b = Buffer.from(provided)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(
    /\/$/,
    '',
  )
}

interface DigestRunResult {
  ok: true
  processed: number
  sent: number
  skipped: number
  errors: string[]
  durationMs: number
}

async function run(): Promise<DigestRunResult> {
  const start = Date.now()
  const errors: string[] = []
  let processed = 0
  let sent = 0
  let skipped = 0

  let supabase
  try {
    supabase = createServiceRoleClient()
  } catch (err) {
    errors.push(err instanceof Error ? err.message : 'service-role init failed')
    return {
      ok: true,
      processed,
      sent,
      skipped,
      errors,
      durationMs: Date.now() - start,
    }
  }

  // Fetch all verified subscriptions in one go. We don't expect this
  // table to grow beyond a few thousand rows in the foreseeable future;
  // when it does, paginate.
  const { data, error } = await supabase
    .from('saved_searches')
    .select(
      'id, email, label, filters, unsubscribe_token, last_sent_at, verified',
    )
    .eq('verified', true)
    .limit(5000)

  if (error || !data) {
    errors.push(`fetch verified: ${error?.message ?? 'no data'}`)
    return {
      ok: true,
      processed,
      sent,
      skipped,
      errors,
      durationMs: Date.now() - start,
    }
  }

  const rows = data as Pick<
    SavedSearchDBRow,
    'id' | 'email' | 'label' | 'filters' | 'unsubscribe_token' | 'last_sent_at'
  >[]

  for (const row of rows) {
    processed += 1
    try {
      const filters = parseFilters(row.filters)
      const since = row.last_sent_at
        ? new Date(row.last_sent_at)
        : new Date(
            Date.now() - DIGEST_DEFAULT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
          )
      const items = await matchSavedSearch(
        supabase,
        filters,
        since,
        MAX_ITEMS_PER_DIGEST,
      )
      if (items.length === 0) {
        skipped += 1
        continue
      }
      const unsubscribeUrl = `${appUrl()}/api/intelligence/subscribe/unsubscribe?token=${encodeURIComponent(
        row.unsubscribe_token,
      )}`
      const mail = buildDigestEmail({
        label: row.label,
        filters,
        items,
        unsubscribeUrl,
      })
      const res = await sendEmail({
        to: row.email,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
        unsubscribeUrl,
      })
      if (!res.ok) {
        errors.push(`send ${row.id}: ${res.error ?? 'unknown'}`)
        continue
      }
      // Use the most-recent published_at among the items as the new
      // watermark. Falling back to now() avoids re-sending the same CVE
      // if items had no publish date.
      const newest =
        items
          .map((i) => i.publishedAt)
          .filter((v): v is string => Boolean(v))
          .sort()
          .at(-1) ?? new Date().toISOString()
      await supabase
        .from('saved_searches')
        .update({ last_sent_at: newest })
        .eq('id', row.id)
      sent += 1
    } catch (err) {
      errors.push(
        `process ${row.id}: ${err instanceof Error ? err.message : 'unknown'}`,
      )
    }
  }

  return {
    ok: true,
    processed,
    sent,
    skipped,
    errors,
    durationMs: Date.now() - start,
  }
}

async function handle(request: Request): Promise<Response> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const result = await run()
  return NextResponse.json(result)
}

export async function GET(request: Request) {
  return handle(request)
}
export async function POST(request: Request) {
  return handle(request)
}
