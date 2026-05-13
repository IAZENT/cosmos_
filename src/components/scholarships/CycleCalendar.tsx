'use client'

import { ExternalLink, Calendar, Clock, AlertCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CosmosCard } from '@/components/ui/CosmosCard'
import { SCHOLARSHIP_CYCLES } from '@/data/scholarship-cycles'
import { formatMonthDay, withStatus } from '@/lib/scholarships/cycle'
import {
  FLAG_BY_COUNTRY,
  type ScholarshipCountry,
} from '@/types/scholarship'
import type { CycleStatus } from '@/types/scholarship-cycle'

const FUNDING_LABEL: Record<string, string> = {
  FULL: 'fully funded',
  PARTIAL: 'partial',
  UNKNOWN: 'see source',
}

function StatusBadge({ status }: { status: CycleStatus }) {
  if (status.kind === 'open_now') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--cosmos-low)] px-2 py-[2px] font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-low)]">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--cosmos-low)] opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--cosmos-low)]" />
        </span>
        open · closes in {status.daysUntilClose}d
      </span>
    )
  }
  if (status.kind === 'opening_soon') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--cosmos-medium)] px-2 py-[2px] font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-medium)]">
        <Clock size={10} aria-hidden />
        opens in {status.daysUntilOpen}d
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--cosmos-border)] px-2 py-[2px] font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
      <Calendar size={10} aria-hidden />
      opens in {status.daysUntilOpen}d
    </span>
  )
}

function CycleCard({
  item,
}: {
  item: ReturnType<typeof withStatus>[number]
}) {
  const { cycle, status } = item
  const flag =
    FLAG_BY_COUNTRY[cycle.country as ScholarshipCountry] ?? '🌍'

  return (
    <CosmosCard as="article">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 text-[20px] leading-none" aria-hidden>
            {flag}
          </span>
          <div className="min-w-0">
            <a
              href={cycle.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-[14px] font-medium text-[var(--cosmos-text)] hover:underline"
            >
              {cycle.name}
            </a>
            <p className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
              <span>{cycle.country}</span>
              <span aria-hidden>·</span>
              <span>
                cycle: {formatMonthDay(cycle.typicalOpen.month, cycle.typicalOpen.day)}
                {' → '}
                {formatMonthDay(cycle.typicalClose.month, cycle.typicalClose.day)}
              </span>
              <span aria-hidden>·</span>
              <span>verified {cycle.verifiedYear}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <StatusBadge status={status} />
          <a
            href={cycle.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-[4px] border border-[var(--cosmos-border)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-muted)] hover:border-[var(--cosmos-accent)] hover:text-[var(--cosmos-text)]"
            aria-label={`Open official ${cycle.name} page`}
          >
            <ExternalLink size={11} aria-hidden />
            official
          </a>
        </div>
      </div>

      <p className="mt-3 text-[13px] leading-relaxed text-[var(--cosmos-text-muted)]">
        {cycle.description}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-[var(--cosmos-border)] px-2 py-[2px] font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-muted)]">
          {FUNDING_LABEL[cycle.funding] ?? 'see source'}
        </span>
        {cycle.levels.map((lvl) => (
          <span
            key={lvl}
            className="rounded-full border border-[var(--cosmos-border)] px-2 py-[2px] font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-muted)]"
          >
            {lvl}
          </span>
        ))}
        {cycle.value ? (
          <span className="rounded-full border border-[var(--cosmos-border-dim)] px-2 py-[2px] font-mono text-[10px] text-[var(--cosmos-text-dim)]">
            {cycle.value}
          </span>
        ) : null}
      </div>

      {cycle.notes ? (
        <p className="mt-3 flex items-start gap-2 rounded-[4px] border border-[var(--cosmos-border-dim)] bg-[var(--cosmos-bg-subtle)] p-2 font-mono text-[11px] leading-relaxed text-[var(--cosmos-text-dim)]">
          <AlertCircle
            size={11}
            aria-hidden
            className="mt-[2px] flex-shrink-0"
          />
          <span>{cycle.notes}</span>
        </p>
      ) : null}
    </CosmosCard>
  )
}

export function CycleCalendar() {
  const [filter, setFilter] = useState<'urgent' | 'all'>('urgent')

  // Recompute statuses on each render. The dataset is tiny (~30 rows)
  // and statuses depend on `now()`, so memoising buys nothing while
  // making 'open in X days' subtly stale across midnight.
  const allItems = useMemo(() => withStatus(SCHOLARSHIP_CYCLES), [])
  const urgentItems = useMemo(
    () =>
      allItems.filter(
        (i) => i.status.kind === 'open_now' || i.status.kind === 'opening_soon',
      ),
    [allItems],
  )

  const items = filter === 'urgent' ? urgentItems : allItems

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--cosmos-code)]">
            {'// curated cycles'}
          </p>
          <h2 className="mt-1 text-[20px] text-[var(--cosmos-text)]">
            Annual scholarship calendar
          </h2>
          <p className="mt-1 max-w-2xl text-[13px] text-[var(--cosmos-text-muted)]">
            Hand-checked cycle data for {SCHOLARSHIP_CYCLES.length} major
            scholarships. Dates shown are typical windows  always confirm
            on the official page below.
          </p>
        </div>
        <div className="flex gap-1 rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-1">
          <button
            type="button"
            onClick={() => setFilter('urgent')}
            className={`rounded-[3px] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors ${
              filter === 'urgent'
                ? 'bg-[var(--cosmos-bg-subtle)] text-[var(--cosmos-text)]'
                : 'text-[var(--cosmos-text-muted)] hover:text-[var(--cosmos-text)]'
            }`}
          >
            opening / open ({urgentItems.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded-[3px] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors ${
              filter === 'all'
                ? 'bg-[var(--cosmos-bg-subtle)] text-[var(--cosmos-text)]'
                : 'text-[var(--cosmos-text-muted)] hover:text-[var(--cosmos-text)]'
            }`}
          >
            all ({allItems.length})
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="rounded-[6px] border border-[var(--cosmos-border-dim)] bg-[var(--cosmos-bg-subtle)] p-4 text-[13px] text-[var(--cosmos-text-muted)]">
          No cycles match. Switch to &quot;all&quot; to see the full annual
          calendar.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {items.map((item) => (
            <CycleCard key={item.cycle.slug} item={item} />
          ))}
        </div>
      )}
    </section>
  )
}
