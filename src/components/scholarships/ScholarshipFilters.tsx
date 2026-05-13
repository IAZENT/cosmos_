'use client'

import { Search, X } from 'lucide-react'
import {
  SCHOLARSHIP_COUNTRIES,
  SCHOLARSHIP_LEVELS,
} from '@/types/scholarship'

export interface ScholarshipFilterState {
  country: 'ALL' | (typeof SCHOLARSHIP_COUNTRIES)[number]
  level: 'ALL' | (typeof SCHOLARSHIP_LEVELS)[number]
  funding: 'ALL' | 'FULL' | 'PARTIAL' | 'UNKNOWN'
  search: string
}

export const DEFAULT_SCHOLARSHIP_FILTERS: ScholarshipFilterState = {
  country: 'ALL',
  level: 'ALL',
  funding: 'ALL',
  search: '',
}

const FUNDING_LABEL: Record<ScholarshipFilterState['funding'], string> = {
  ALL: 'any funding',
  FULL: 'fully funded',
  PARTIAL: 'partial / stipend',
  UNKNOWN: 'unspecified',
}

export function ScholarshipFilters({
  state,
  onChange,
  onReset,
}: {
  state: ScholarshipFilterState
  onChange: (next: ScholarshipFilterState) => void
  onReset: () => void
}) {
  const dirty =
    state.country !== 'ALL' ||
    state.level !== 'ALL' ||
    state.funding !== 'ALL' ||
    state.search.trim().length > 0

  return (
    <div className="flex flex-col gap-3 rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-4">
      <div className="flex items-center gap-2 rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] px-3 py-2">
        <Search size={14} className="text-[var(--cosmos-text-dim)]" aria-hidden />
        <input
          type="text"
          value={state.search}
          onChange={(e) => onChange({ ...state, search: e.target.value })}
          placeholder="Search title or summary…"
          className="w-full bg-transparent font-mono text-[13px] text-[var(--cosmos-text)] placeholder:text-[var(--cosmos-text-dim)] focus:outline-none"
          aria-label="Search scholarships"
        />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
            Country
          </span>
          <select
            value={state.country}
            onChange={(e) =>
              onChange({
                ...state,
                country: e.target
                  .value as ScholarshipFilterState['country'],
              })
            }
            className="rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] px-2.5 py-2 font-mono text-[13px] text-[var(--cosmos-text)] focus:outline-none"
          >
            <option value="ALL">All countries</option>
            {SCHOLARSHIP_COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
            Level
          </span>
          <select
            value={state.level}
            onChange={(e) =>
              onChange({
                ...state,
                level: e.target.value as ScholarshipFilterState['level'],
              })
            }
            className="rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] px-2.5 py-2 font-mono text-[13px] text-[var(--cosmos-text)] focus:outline-none"
          >
            <option value="ALL">All levels</option>
            {SCHOLARSHIP_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
            Funding
          </span>
          <select
            value={state.funding}
            onChange={(e) =>
              onChange({
                ...state,
                funding: e.target.value as ScholarshipFilterState['funding'],
              })
            }
            className="rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] px-2.5 py-2 font-mono text-[13px] text-[var(--cosmos-text)] focus:outline-none"
          >
            {(Object.keys(FUNDING_LABEL) as Array<keyof typeof FUNDING_LABEL>).map(
              (k) => (
                <option key={k} value={k}>
                  {FUNDING_LABEL[k]}
                </option>
              ),
            )}
          </select>
        </label>
      </div>

      {dirty ? (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex w-fit items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-muted)] hover:text-[var(--cosmos-text)]"
        >
          <X size={11} aria-hidden />
          reset filters
        </button>
      ) : null}
    </div>
  )
}
