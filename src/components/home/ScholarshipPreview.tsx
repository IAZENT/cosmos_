import Link from 'next/link'
import { Activity, Calendar, Clock } from 'lucide-react'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { CosmosCard } from '@/components/ui/CosmosCard'
import { SCHOLARSHIP_CYCLES } from '@/data/scholarship-cycles'
import { formatMonthDay, withStatus } from '@/lib/scholarships/cycle'
import { getCycleActivity } from '@/lib/scholarships/cycle-server'
import {
  FLAG_BY_COUNTRY,
  type ScholarshipCountry,
} from '@/types/scholarship'
import type {
  CycleActivity,
  CycleStatus,
} from '@/types/scholarship-cycle'

const PREVIEW_COUNT = 3
// 90 days is generous: the homepage promises 'next 90 days', which is
// long enough that the section is never empty (the cycle calendar has
// at least 3 entries opening within any 90-day window).
const PREVIEW_HORIZON_DAYS = 90

function StatusBadge({ status }: { status: CycleStatus }) {
  // Note: we intentionally never render the 'open_now' variant here 
  // the homepage section is exclusively for *upcoming* cycles. The
  // /scholarships page handles the 'currently open' case.
  if (status.kind === 'opening_soon') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--cosmos-medium)] px-2 py-[2px] font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-medium)]">
        <Clock size={10} aria-hidden />
        opens in {status.daysUntilOpen}d
      </span>
    )
  }
  if (status.kind === 'later') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--cosmos-border)] px-2 py-[2px] font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
        <Calendar size={10} aria-hidden />
        opens in {status.daysUntilOpen}d
      </span>
    )
  }
  return null
}

function ActivityBadge({ activity }: { activity: CycleActivity }) {
  if (activity.mentions30d === 0) return null
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-[var(--cosmos-accent)] bg-[var(--cosmos-bg-subtle)] px-2 py-[2px] font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-accent)]"
      title="Currently active in our live RSS feed (last 30 days)"
    >
      <Activity size={10} aria-hidden />
      live · {activity.mentions30d}
    </span>
  )
}

/**
 * Homepage section: the next 3 *upcoming* scholarship cycles.
 *
 * Selection logic (post-user-feedback):
 *   - Strictly excludes `open_now` cycles  the homepage promise is
 *     'opening in the next 90 days', not 'currently open'.
 *   - Prefers `opening_soon` (within 90 days), sorted by soonest open.
 *   - Pads with `later` items if fewer than 3 are within the horizon.
 *
 * Dynamism:
 *   - Day counters refresh with the page-level `revalidate=60`, so
 *     'opens in 23d' is always within a minute of accurate.
 *   - Live activity badge surfaces the news-mention count from the last
 *     30 days  no manual data updates required when a cycle goes live.
 *   - Year auto-rolls via `withStatus()`: when 2026's cycle ends,
 *     2027's takes its place automatically.
 */
export async function ScholarshipPreview() {
  const all = withStatus(SCHOLARSHIP_CYCLES)

  // Strict 'opening_soon within horizon', then 'later' as fallback.
  // We never include open_now  this section is forward-looking.
  const upcoming = all.filter(
    (i) =>
      i.status.kind === 'opening_soon' &&
      i.status.daysUntilOpen <= PREVIEW_HORIZON_DAYS,
  )
  const fallback = all.filter((i) => i.status.kind === 'later')
  const picks = [
    ...upcoming,
    ...fallback.slice(0, Math.max(0, PREVIEW_COUNT - upcoming.length)),
  ].slice(0, PREVIEW_COUNT)

  // Fetch activity only for the selected slugs  no point hitting
  // Supabase for cycles we won't render. (The DB query itself is one
  // round trip; this just trims the post-fetch matching.)
  const activity = await getCycleActivity(picks.map((p) => p.cycle))

  return (
    <section className="cosmos-section">
      <div className="cosmos-container">
        <SectionLabel>opening soon</SectionLabel>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="max-w-xl text-[40px] leading-[1.1] tracking-[-0.02em] text-[var(--cosmos-text)] md:text-[56px]">
            Scholarships opening
            <br />
            in the next 90 days.
          </h2>
          <Link
            href="/scholarships"
            className="font-mono text-[12px] text-[var(--cosmos-accent)] hover:underline"
          >
            → Full annual calendar
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {picks.map((item) => {
            const { cycle, status } = item
            const flag =
              FLAG_BY_COUNTRY[cycle.country as ScholarshipCountry] ?? '🌍'
            const a = activity.get(cycle.slug) ?? {
              mentions30d: 0,
              liveVerified: false,
            }
            return (
              <a
                key={cycle.slug}
                href={cycle.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
                aria-label={`${cycle.name}  open official page`}
              >
                <CosmosCard
                  interactive
                  className="flex h-full flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[24px] leading-none" aria-hidden>
                      {flag}
                    </span>
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <ActivityBadge activity={a} />
                      <StatusBadge status={status} />
                    </div>
                  </div>
                  <h3 className="text-[16px] leading-snug text-[var(--cosmos-text)]">
                    {cycle.name}
                  </h3>
                  <p className="min-h-[3.6rem] text-[12px] leading-relaxed text-[var(--cosmos-text-muted)]">
                    {cycle.description.length > 130
                      ? `${cycle.description.slice(0, 130)}…`
                      : cycle.description}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
                    <span>
                      {formatMonthDay(
                        cycle.typicalOpen.month,
                        cycle.typicalOpen.day,
                      )}
                      {' → '}
                      {formatMonthDay(
                        cycle.typicalClose.month,
                        cycle.typicalClose.day,
                      )}
                    </span>
                    <span>{cycle.country}</span>
                  </div>
                </CosmosCard>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
