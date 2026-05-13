'use client'

import { Search, X } from 'lucide-react'
import { useId } from 'react'
import { cn } from '@/lib/utils/cn'

export type SeverityFilter =
  | 'ALL'
  | 'CRITICAL'
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'

export interface CVEFilterState {
  severity: SeverityFilter
  kevOnly: boolean
  search: string
  from: string
  to: string
}

export const DEFAULT_FILTER_STATE: CVEFilterState = {
  severity: 'ALL',
  kevOnly: false,
  search: '',
  from: '',
  to: '',
}

const SEVERITIES: SeverityFilter[] = [
  'ALL',
  'CRITICAL',
  'HIGH',
  'MEDIUM',
  'LOW',
]

export function CVEFilters({
  state,
  onChange,
  onReset,
}: {
  state: CVEFilterState
  onChange: (next: CVEFilterState) => void
  onReset: () => void
}) {
  const searchId = useId()
  const fromId = useId()
  const toId = useId()

  return (
    <div className="rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-4">
      <div className="flex flex-wrap items-center gap-2">
        {SEVERITIES.map((s) => {
          const active = state.severity === s
          return (
            <button
              key={s}
              type="button"
              onClick={() => onChange({ ...state, severity: s })}
              className={cn(
                'rounded-[4px] border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors',
                active
                  ? 'border-[var(--cosmos-accent)] text-[var(--cosmos-accent)]'
                  : 'border-[var(--cosmos-border)] text-[var(--cosmos-text-muted)] hover:border-[var(--cosmos-text-dim)] hover:text-[var(--cosmos-text)]',
              )}
            >
              {s}
            </button>
          )
        })}

        <label className="ml-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--cosmos-text-muted)]">
          <input
            type="checkbox"
            checked={state.kevOnly}
            onChange={(e) =>
              onChange({ ...state, kevOnly: e.target.checked })
            }
            className="h-3 w-3 accent-[var(--cosmos-accent)]"
          />
          KEV only
        </label>

        <div className="ml-auto flex items-center gap-2">
          <label htmlFor={searchId} className="sr-only">
            Search CVEs
          </label>
          <div className="flex items-center gap-2 rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] px-2.5 py-1.5">
            <Search
              size={12}
              className="text-[var(--cosmos-text-dim)]"
              aria-hidden
            />
            <input
              id={searchId}
              type="search"
              value={state.search}
              placeholder="CVE-2025-… or keyword"
              onChange={(e) =>
                onChange({ ...state, search: e.target.value })
              }
              className="w-[14rem] bg-transparent font-mono text-[12px] text-[var(--cosmos-text)] placeholder:text-[var(--cosmos-text-dim)] focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[var(--cosmos-border-dim)] pt-3">
        <div className="flex items-center gap-2">
          <label
            htmlFor={fromId}
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]"
          >
            From
          </label>
          <input
            id={fromId}
            type="date"
            value={state.from}
            onChange={(e) => onChange({ ...state, from: e.target.value })}
            className="rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] px-2 py-1 font-mono text-[11px] text-[var(--cosmos-text)]"
          />
        </div>
        <div className="flex items-center gap-2">
          <label
            htmlFor={toId}
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]"
          >
            To
          </label>
          <input
            id={toId}
            type="date"
            value={state.to}
            onChange={(e) => onChange({ ...state, to: e.target.value })}
            className="rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] px-2 py-1 font-mono text-[11px] text-[var(--cosmos-text)]"
          />
        </div>
        <button
          type="button"
          onClick={onReset}
          className="ml-auto inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--cosmos-text-muted)] hover:text-[var(--cosmos-text)]"
        >
          <X size={12} aria-hidden /> Reset
        </button>
      </div>
    </div>
  )
}
