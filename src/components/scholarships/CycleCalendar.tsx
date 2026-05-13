import { SCHOLARSHIP_CYCLES } from '@/data/scholarship-cycles'
import { withStatus } from '@/lib/scholarships/cycle'
import { getCycleActivity } from '@/lib/scholarships/cycle-server'
import {
  CycleCalendarClient,
  type CycleWithActivity,
} from '@/components/scholarships/CycleCalendarClient'

/**
 * Server wrapper. Fetches news activity in one batched query, attaches
 * it to each cycle, then hands the fully-prepared list to the client
 * component for interactivity (the urgent/all toggle).
 *
 * Sort heuristic: keep the 'open now → opening soon → later' bucketing
 * (handled by `withStatus` already), but within each bucket promote
 * cycles with live activity. This means a Chevening with 12 fresh news
 * mentions outranks a Rhodes with zero, even when both have the same
 * 'opens in 47d' status  the activity is a real-world signal that
 * the cycle is actually running this year.
 */
export async function CycleCalendar() {
  const withStatusItems = withStatus(SCHOLARSHIP_CYCLES)
  const activity = await getCycleActivity(SCHOLARSHIP_CYCLES)

  const items: CycleWithActivity[] = withStatusItems
    .map((s) => ({
      ...s,
      activity: activity.get(s.cycle.slug) ?? {
        mentions30d: 0,
        liveVerified: false,
      },
    }))
    // Stable sort: preserves the urgency bucket order from `withStatus`
    // and only re-sorts ties on activity.
    .sort((a, b) => {
      // First by status bucket (already done, but keep deterministic).
      const order = { open_now: 0, opening_soon: 1, later: 2 } as const
      const ord = order[a.status.kind] - order[b.status.kind]
      if (ord !== 0) return ord
      // Within a bucket: more activity first.
      if (a.activity.mentions30d !== b.activity.mentions30d) {
        return b.activity.mentions30d - a.activity.mentions30d
      }
      // Then the original urgency tiebreak (soonest first).
      if (a.status.kind === 'open_now' && b.status.kind === 'open_now') {
        return a.status.daysUntilClose - b.status.daysUntilClose
      }
      if (a.status.kind !== 'open_now' && b.status.kind !== 'open_now') {
        return a.status.daysUntilOpen - b.status.daysUntilOpen
      }
      return 0
    })

  return (
    <CycleCalendarClient items={items} totalCount={SCHOLARSHIP_CYCLES.length} />
  )
}
