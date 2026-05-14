'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import { useEffect, useId, useMemo, useState } from 'react'
import { AlertTriangle, Loader2, Search, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import {
  ARSENAL_CATEGORIES,
  ARSENAL_DIFFICULTIES,
  ARSENAL_PLATFORMS,
  ARSENAL_USE_CASES,
  CATEGORY_LABEL,
  type ArsenalCategory,
  type ArsenalDifficulty,
  type ArsenalPlatform,
  type ArsenalUseCase,
} from '@/lib/arsenal/constants'
import type {
  ArsenalEntry,
  ArsenalFallbackResponse,
  ArsenalSearchResponse,
} from '@/types/arsenal'
import { ArsenalEntryCard } from '@/components/arsenal/ArsenalEntry'

interface CategoryCount {
  category: string
  count: number
}

interface Props {
  initialEntries: ArsenalEntry[]
  initialTotal: number
  categoryCounts: CategoryCount[]
  isAdmin: boolean
}

const fetcher = async (url: string): Promise<ArsenalSearchResponse> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`arsenal ${res.status}`)
  return (await res.json()) as ArsenalSearchResponse
}

type CatFilter = ArsenalCategory | 'all'
type PlatFilter = ArsenalPlatform | 'all'
type DiffFilter = ArsenalDifficulty | 'all'
type UseCaseFilter = ArsenalUseCase | 'all'

export function ArsenalClient({
  initialEntries,
  initialTotal,
  categoryCounts,
  isAdmin,
}: Props) {
  const searchId = useId()
  const urlParams = useSearchParams()
  const initialQ = urlParams.get('q') ?? ''
  const [queryInput, setQueryInput] = useState(initialQ)
  const [query, setQuery] = useState(initialQ)
  const [category, setCategory] = useState<CatFilter>('all')
  const [platform, setPlatform] = useState<PlatFilter>('all')
  const [difficulty, setDifficulty] = useState<DiffFilter>('all')
  const [useCase, setUseCase] = useState<UseCaseFilter>('all')

  // 300ms debounce on the search input.
  useEffect(() => {
    const id = window.setTimeout(() => setQuery(queryInput.trim()), 300)
    return () => window.clearTimeout(id)
  }, [queryInput])

  const skip =
    !query &&
    category === 'all' &&
    platform === 'all' &&
    difficulty === 'all' &&
    useCase === 'all'

  const apiUrl = useMemo(() => {
    const p = new URLSearchParams()
    if (query) p.set('q', query)
    if (category !== 'all') p.set('category', category)
    if (platform !== 'all') p.set('platform', platform)
    if (difficulty !== 'all') p.set('difficulty', difficulty)
    if (useCase !== 'all') p.set('use_case', useCase)
    p.set('limit', '100')
    return `/api/arsenal?${p.toString()}`
  }, [query, category, platform, difficulty, useCase])

  const fallback: ArsenalSearchResponse = {
    entries: initialEntries,
    total: initialTotal,
  }

  const { data, isLoading } = useSWR<ArsenalSearchResponse>(
    skip ? null : apiUrl,
    fetcher,
    skip
      ? { fallbackData: fallback, revalidateOnFocus: false }
      : { revalidateOnFocus: false, keepPreviousData: true },
  )

  const entries = skip ? initialEntries : data?.entries ?? []
  const total = skip ? initialTotal : data?.total ?? 0
  const noResults = !isLoading && entries.length === 0
  const aiEligible = noResults && query.length >= 3

  const sidebar = useMemo(() => {
    const all = categoryCounts.reduce((acc, c) => acc + c.count, 0)
    const map = new Map(categoryCounts.map((c) => [c.category, c.count]))
    return {
      total: all,
      rows: ARSENAL_CATEGORIES.filter((c) => map.has(c)).map((c) => ({
        category: c,
        count: map.get(c) ?? 0,
      })),
    }
  }, [categoryCounts])

  const pinned = entries.filter((e) => e.pinned)
  const regular = entries.filter((e) => !e.pinned)

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="hidden md:block">
        <div className="sticky top-20 flex flex-col gap-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-code)]">
            {'// categories'}
          </p>
          <nav className="flex flex-col">
            <SidebarRow
              label="All"
              count={sidebar.total}
              active={category === 'all'}
              onClick={() => setCategory('all')}
            />
            <div className="my-2 border-t border-[var(--cosmos-border-dim)]" />
            {sidebar.rows.map((row) => (
              <SidebarRow
                key={row.category}
                label={CATEGORY_LABEL[row.category as ArsenalCategory] ?? row.category}
                count={row.count}
                active={category === row.category}
                onClick={() =>
                  setCategory(row.category as CatFilter)
                }
              />
            ))}
          </nav>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col gap-6">
        {/* Search input */}
        <div className="flex items-center gap-2 rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] px-3 py-3 focus-within:border-[var(--cosmos-text-muted)]">
          <Search size={14} className="text-[var(--cosmos-text-dim)]" aria-hidden />
          <label htmlFor={searchId} className="sr-only">
            Search arsenal
          </label>
          <input
            id={searchId}
            type="search"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Search commands, techniques, tools…"
            className="flex-1 bg-transparent font-mono text-[14px] text-[var(--cosmos-text)] placeholder:text-[var(--cosmos-text-dim)] focus:outline-none"
          />
          {queryInput ? (
            <button
              type="button"
              onClick={() => setQueryInput('')}
              aria-label="Clear search"
              className="text-[var(--cosmos-text-dim)] hover:text-[var(--cosmos-text)]"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3">
          {/* Category pills (mobile, also handy on desktop) */}
          <div className="cosmos-scroll-x flex items-center gap-1.5 whitespace-nowrap md:hidden">
            <Pill
              label="ALL"
              active={category === 'all'}
              onClick={() => setCategory('all')}
            />
            {sidebar.rows.map((row) => (
              <Pill
                key={row.category}
                label={CATEGORY_LABEL[row.category as ArsenalCategory] ?? row.category}
                active={category === row.category}
                onClick={() =>
                  setCategory(row.category as CatFilter)
                }
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <SelectField
              label="Platform"
              value={platform}
              onChange={(v) => setPlatform(v as PlatFilter)}
              options={[
                { value: 'all', label: 'Any' },
                ...ARSENAL_PLATFORMS.map((p) => ({ value: p, label: p })),
              ]}
            />
            <SelectField
              label="Difficulty"
              value={difficulty}
              onChange={(v) => setDifficulty(v as DiffFilter)}
              options={[
                { value: 'all', label: 'All' },
                ...ARSENAL_DIFFICULTIES.map((p) => ({ value: p, label: p })),
              ]}
            />
            <SelectField
              label="Use case"
              value={useCase}
              onChange={(v) => setUseCase(v as UseCaseFilter)}
              options={[
                { value: 'all', label: 'All' },
                ...ARSENAL_USE_CASES.map((p) => ({ value: p, label: p })),
              ]}
            />
            {(query ||
              category !== 'all' ||
              platform !== 'all' ||
              difficulty !== 'all' ||
              useCase !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setQueryInput('')
                  setQuery('')
                  setCategory('all')
                  setPlatform('all')
                  setDifficulty('all')
                  setUseCase('all')
                }}
                className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--cosmos-text-muted)] hover:text-[var(--cosmos-text)]"
              >
                reset
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
          {`// ${total.toLocaleString('en-US')} ${total === 1 ? 'entry' : 'entries'}`}
          {isLoading ? ' · searching…' : ''}
        </p>

        {pinned.length > 0 ? (
          <section className="flex flex-col gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-accent)]">
              {'// pinned'}
            </p>
            {pinned.map((e, i) => (
              <ArsenalEntryCard key={e.id} entry={e} index={i} />
            ))}
            <div className="mt-2 border-t border-[var(--cosmos-border-dim)]" />
          </section>
        ) : null}

        {regular.length > 0 ? (
          <section className="flex flex-col gap-3">
            {regular.map((e, i) => (
              <ArsenalEntryCard
                key={e.id}
                entry={e}
                index={pinned.length + i}
              />
            ))}
          </section>
        ) : null}

        {noResults ? (
          <div className="rounded-[6px] border border-dashed border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)]/50 p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--cosmos-code)]">
              {'// not in database'}
            </p>
            <p className="mt-2 text-[14px] text-[var(--cosmos-text)]">
              No local entries match{query ? ` "${query}"` : ' the current filters'}.
            </p>
            {aiEligible ? (
              <FallbackBlock query={query} isAdmin={isAdmin} />
            ) : (
              <p className="mt-2 font-mono text-[11px] text-[var(--cosmos-text-dim)]">
                Try a different keyword or reset filters.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function SidebarRow({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center justify-between border-l-2 py-1.5 pl-3 pr-1 text-left font-mono text-[12px] transition-colors',
        active
          ? 'border-[var(--cosmos-accent)] text-[var(--cosmos-accent)]'
          : 'border-transparent text-[var(--cosmos-text-muted)] hover:text-[var(--cosmos-text)]',
      )}
    >
      <span>{label}</span>
      <span className="text-[10px] text-[var(--cosmos-text-dim)]">
        ({count})
      </span>
    </button>
  )
}

function Pill({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-[4px] border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em]',
        active
          ? 'border-[var(--cosmos-accent)] text-[var(--cosmos-accent)]'
          : 'border-[var(--cosmos-border)] text-[var(--cosmos-text-muted)] hover:text-[var(--cosmos-text)]',
      )}
    >
      {label}
    </button>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label className="flex items-center gap-2 font-mono text-[11px] text-[var(--cosmos-text-muted)]">
      <span className="uppercase tracking-[0.08em] text-[var(--cosmos-text-dim)]">
        {label}:
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] px-2 py-1 font-mono text-[11px] text-[var(--cosmos-text)] focus:border-[var(--cosmos-text-muted)] focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function FallbackBlock({ query, isAdmin }: { query: string; isAdmin: boolean }) {
  const [state, setState] = useState<
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'error'; error: string }
    | { status: 'ok'; data: ArsenalFallbackResponse }
  >({ status: 'idle' })

  const run = async () => {
    setState({ status: 'loading' })
    try {
      const res = await fetch('/api/arsenal/fallback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      const json = (await res.json()) as ArsenalFallbackResponse
      if (!res.ok || json.error) {
        setState({
          status: 'error',
          error: json.error ?? `request failed (${res.status})`,
        })
        return
      }
      setState({ status: 'ok', data: json })
    } catch (err) {
      setState({
        status: 'error',
        error: err instanceof Error ? err.message : 'unknown error',
      })
    }
  }

  if (state.status === 'idle') {
    return (
      <button
        type="button"
        onClick={run}
        className="cosmos-btn-ghost mt-3"
      >
        <Sparkles size={12} aria-hidden />
        ask AI for &ldquo;{query.slice(0, 40)}&rdquo;
      </button>
    )
  }
  if (state.status === 'loading') {
    return (
      <p className="mt-3 inline-flex items-center gap-2 font-mono text-[12px] text-[var(--cosmos-text-muted)]">
        <Loader2 size={12} className="animate-spin" aria-hidden />
        searching the web for &ldquo;{query}&rdquo;…
      </p>
    )
  }
  if (state.status === 'error') {
    return (
      <p className="mt-3 inline-flex items-start gap-2 rounded-[4px] border border-[var(--cosmos-critical)]/40 bg-[var(--cosmos-critical)]/10 px-3 py-2 font-mono text-[11px] text-[var(--cosmos-critical)]">
        <AlertTriangle size={12} aria-hidden className="mt-0.5" />
        {state.error}
      </p>
    )
  }

  const result = state.data.result
  if (!result) {
    return (
      <p className="mt-3 font-mono text-[11px] text-[var(--cosmos-text-muted)]">
        {state.data.error ?? 'no result.'}
      </p>
    )
  }

  return (
    <div className="mt-4 rounded-[6px] border border-[var(--cosmos-medium)]/50 bg-[var(--cosmos-medium)]/[0.06] p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-medium)]">
        {'// ai fallback · not from local database'}
      </p>
      <p className="mt-1 inline-flex items-center gap-1.5 font-mono text-[11px] text-[var(--cosmos-medium)]">
        <AlertTriangle size={12} aria-hidden />
        {result.disclaimer}
      </p>
      <h3 className="mt-3 text-[15px] text-[var(--cosmos-text)]">{result.title}</h3>
      {result.description ? (
        <p className="mt-1 text-[13px] text-[var(--cosmos-text-muted)]">
          {result.description}
        </p>
      ) : null}
      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words rounded-[4px] border border-[var(--cosmos-border-dim)] bg-[var(--cosmos-bg)] px-4 py-3 font-mono text-[13px] leading-relaxed text-[var(--cosmos-text)]">
        {result.command}
      </pre>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(result.command)
            } catch {
              /* ignore */
            }
          }}
          className="cosmos-btn-ghost"
        >
          copy
        </button>
        {isAdmin ? (
          <Link
            href={`/user2admin/arsenal/new?title=${encodeURIComponent(result.title)}&command=${encodeURIComponent(result.command)}&description=${encodeURIComponent(result.description)}&category=${encodeURIComponent(result.category)}&tags=${encodeURIComponent((result.tags ?? []).join(', '))}&note=${encodeURIComponent(result.note)}`}
            className="cosmos-btn-primary"
          >
            → add to ARSENAL
          </Link>
        ) : null}
      </div>
      {result.note ? (
        <p className="mt-3 border-l-2 border-[var(--cosmos-accent-dim)] pl-3 text-[13px] text-[var(--cosmos-text-muted)]">
          <span className="text-[var(--cosmos-accent)]">↳</span> {result.note}
        </p>
      ) : null}
    </div>
  )
}
