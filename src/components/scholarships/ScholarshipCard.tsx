'use client'

import { memo } from 'react'
import { ExternalLink } from 'lucide-react'
import { CosmosCard } from '@/components/ui/CosmosCard'
import { formatRelative } from '@/lib/utils/date'
import {
  FLAG_BY_COUNTRY,
  type ScholarshipCountry,
  type ScholarshipNewsRow,
} from '@/types/scholarship'

const FUNDING_STYLE: Record<string, string> = {
  FULL: 'border-[var(--cosmos-low)] text-[var(--cosmos-low)]',
  PARTIAL: 'border-[var(--cosmos-medium)] text-[var(--cosmos-medium)]',
  UNKNOWN: 'border-[var(--cosmos-border)] text-[var(--cosmos-text-dim)]',
}

const FUNDING_LABEL: Record<string, string> = {
  FULL: 'fully funded',
  PARTIAL: 'partial',
  UNKNOWN: 'funding unspecified',
}

function ScholarshipCardImpl({ row }: { row: ScholarshipNewsRow }) {
  const flags = (row.countries.length > 0 ? row.countries : ['Other'])
    .slice(0, 3)
    .map((c) => FLAG_BY_COUNTRY[c as ScholarshipCountry] ?? '🌍')
    .join(' ')

  return (
    <CosmosCard as="article">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 text-[20px] leading-none" aria-hidden>
            {flags}
          </span>
          <div className="min-w-0">
            <a
              href={row.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate text-[14px] font-medium text-[var(--cosmos-text)] hover:underline"
              title={row.title}
            >
              {row.title}
            </a>
            <p className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
              <span>{row.source}</span>
              {row.published_at ? (
                <>
                  <span aria-hidden>·</span>
                  <span>{formatRelative(row.published_at)}</span>
                </>
              ) : null}
              {row.countries.length > 0 ? (
                <>
                  <span aria-hidden>·</span>
                  <span>{row.countries.join(' / ')}</span>
                </>
              ) : null}
            </p>
          </div>
        </div>
        <a
          href={row.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-[4px] border border-[var(--cosmos-border)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-muted)] hover:border-[var(--cosmos-accent)] hover:text-[var(--cosmos-text)]"
          aria-label="Open original posting"
        >
          <ExternalLink size={11} aria-hidden />
          open
        </a>
      </div>

      {row.summary ? (
        <p className="mt-3 text-[13px] leading-relaxed text-[var(--cosmos-text-muted)]">
          {row.summary.length > 260
            ? `${row.summary.slice(0, 260)}…`
            : row.summary}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full border px-2 py-[2px] font-mono text-[10px] uppercase tracking-[0.12em] ${
            FUNDING_STYLE[row.funding] ?? FUNDING_STYLE.UNKNOWN
          }`}
        >
          {FUNDING_LABEL[row.funding] ?? FUNDING_LABEL.UNKNOWN}
        </span>
        {row.levels.map((lvl) => (
          <span
            key={lvl}
            className="rounded-full border border-[var(--cosmos-border)] px-2 py-[2px] font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-muted)]"
          >
            {lvl}
          </span>
        ))}
        {row.deadline_at ? (
          <span className="rounded-full border border-[var(--cosmos-critical)] px-2 py-[2px] font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-critical)]">
            deadline {row.deadline_at.slice(0, 10)}
          </span>
        ) : null}
      </div>
    </CosmosCard>
  )
}

// Reference equality is enough  parent feeds always pass stable rows
// straight from SWR cache, so a shallow memo skips render of unchanged
// list items when the page or selection state changes around them.
export const ScholarshipCard = memo(ScholarshipCardImpl)
