import Link from 'next/link'
import { Calendar, Clock } from 'lucide-react'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { CosmosCard } from '@/components/ui/CosmosCard'
import { SCHOLARSHIP_CYCLES } from '@/data/scholarship-cycles'
import { formatMonthDay, withStatus } from '@/lib/scholarships/cycle'
import {
  FLAG_BY_COUNTRY,
  type ScholarshipCountry,
} from '@/types/scholarship'
import type { CycleStatus } from '@/types/scholarship-cycle'

const PREVIEW_COUNT = 3
// Slightly above 30 so the preview can pad to PREVIEW_COUNT cards even
// in late-quiet months. Empirically Aug-Nov is dense (Chevening, DAAD,
// Eiffel etc.); Apr-May is the sparsest.
const PREVIEW_HORIZON_DAYS = 60

function StatusBadge({ status }: { status: CycleStatus }) {
  if (status.kind === 'open_now') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--cosmos-low)] px-2 py-[2px] font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-low)]">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--cosmos-low)] opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--cosmos-low)]" />
        </span>
        open · closes {status.daysUntilClose}d
      </span>
    )
  }
  if (status.kind === 'opening_soon') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--cosmos-medium)] px-2 py-[2px] font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-medium)]">
        <Clock size={10} aria-hidden />
        opens in {status.daysUntilOpen}d
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--cosmos-border)] px-2 py-[2px] font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
      <Calendar size={10} aria-hidden />
      opens in {status.daysUntilOpen}d
    </span>
  )
}

/**
 * Homepage section: 3 most-urgent scholarship cycles.
 *
 * This is a server component because the cycle data is a static TS
 * constant  no SWR or client state needed, and rendering on the server
 * keeps the homepage TTFB snappy. The status calculation depends on
 * `new Date()` so we set `revalidate` on the page (already 60s) to keep
 * the day-counter fresh.
 */
export function ScholarshipPreview() {
  const all = withStatus(SCHOLARSHIP_CYCLES)

  // Prefer urgent items (open_now + opening_soon within horizon); fall
  // back to the next-soonest 'later' items to always fill the row.
  const urgent = all.filter(
    (i) =>
      i.status.kind === 'open_now' ||
      (i.status.kind === 'opening_soon' &&
        i.status.daysUntilOpen <= PREVIEW_HORIZON_DAYS),
  )
  const padded =
    urgent.length >= PREVIEW_COUNT
      ? urgent.slice(0, PREVIEW_COUNT)
      : [
          ...urgent,
          ...all
            .filter((i) => i.status.kind === 'later')
            .slice(0, PREVIEW_COUNT - urgent.length),
        ]

  return (
    <section className="cosmos-section">
      <div className="cosmos-container">
        <SectionLabel>opening soon</SectionLabel>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="max-w-xl text-[40px] leading-[1.1] tracking-[-0.02em] text-[var(--cosmos-text)] md:text-[56px]">
            Scholarships opening
            <br />
            in the next 60 days.
          </h2>
          <Link
            href="/scholarships"
            className="font-mono text-[12px] text-[var(--cosmos-accent)] hover:underline"
          >
            → Full annual calendar
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {padded.map((item) => {
            const { cycle, status } = item
            const flag =
              FLAG_BY_COUNTRY[cycle.country as ScholarshipCountry] ?? '🌍'
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
                  <StatusBadge status={status} />
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
