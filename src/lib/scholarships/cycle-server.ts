import 'server-only'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type {
  CycleActivity,
  ScholarshipCycle,
} from '@/types/scholarship-cycle'

/**
 * Strength threshold: at least 1 mention in the last 30 days promotes
 * a cycle from "static curated entry" to "live-verified" in the UI.
 * Empirically, a single OpportunityDesk post mentioning the brand name
 * (e.g. "Chevening 2026 applications open") is signal enough to trust
 * that the programme is currently active.
 */
const LIVE_VERIFIED_THRESHOLD = 1

const LOOKBACK_DAYS = 30

/**
 * Fetch news-mention counts for every curated cycle in a single round
 * trip (one Supabase query, no N+1).
 *
 * Strategy: pull the last LOOKBACK_DAYS of `scholarship_news` rows
 * (typically 200-400 rows  cheap), then count keyword hits in app
 * code. Doing the matching in JS instead of N parallel ILIKE queries
 * keeps the cron-friendly DB load low and lets us reuse identical
 * matching logic between server and (eventually) client previews.
 *
 * Returns an empty Map if Supabase isn't configured  callers fall
 * back to the static cycle data.
 */
export async function getCycleActivity(
  cycles: ScholarshipCycle[],
): Promise<Map<string, CycleActivity>> {
  const empty = new Map<string, CycleActivity>(
    cycles.map((c) => [c.slug, { mentions30d: 0, liveVerified: false }]),
  )

  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
  if (!supabaseConfigured) return empty

  try {
    const supabase = await createServerSupabaseClient()
    const since = new Date(
      Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString()

    const { data, error } = await supabase
      .from('scholarship_news')
      .select('title, summary')
      .gte('published_at', since)
      .limit(1000)

    if (error || !data) return empty

    // Pre-lowercase the corpus once so the per-cycle inner loop is just
    // .includes() against a stable string.
    const corpus = data.map((row) => {
      const r = row as { title: string | null; summary: string | null }
      return `${r.title ?? ''} ${r.summary ?? ''}`.toLowerCase()
    })

    const out = new Map<string, CycleActivity>()
    for (const cycle of cycles) {
      let count = 0
      const kws = cycle.matchKeywords.map((k) => k.toLowerCase())
      for (const text of corpus) {
        // ANY-of-keywords match (a hit is a hit; we don't double-count
        // a single post that mentions multiple terms for the same
        // scholarship).
        if (kws.some((kw) => text.includes(kw))) count += 1
      }
      out.set(cycle.slug, {
        mentions30d: count,
        liveVerified: count >= LIVE_VERIFIED_THRESHOLD,
      })
    }
    return out
  } catch {
    // The activity layer is purely an enhancement  any failure here
    // should leave the static cycle data fully usable.
    return empty
  }
}
