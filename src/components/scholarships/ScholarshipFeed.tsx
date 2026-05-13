'use client'

import useSWRInfinite from 'swr/infinite'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ScholarshipCard } from '@/components/scholarships/ScholarshipCard'
import {
  ScholarshipFilters,
  DEFAULT_SCHOLARSHIP_FILTERS,
  type ScholarshipFilterState,
} from '@/components/scholarships/ScholarshipFilters'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import type { ScholarshipFeedResponse } from '@/app/api/scholarships/route'

const PAGE_SIZE = 20

const fetcher = async (url: string): Promise<ScholarshipFeedResponse> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`scholarships ${res.status}`)
  return res.json()
}

function buildKey(
  index: number,
  prev: ScholarshipFeedResponse | null,
  filters: ScholarshipFilterState,
): string | null {
  if (prev && prev.items.length === 0 && index > 0) return null
  const params = new URLSearchParams({
    limit: String(PAGE_SIZE),
    offset: String(index * PAGE_SIZE),
  })
  if (filters.country !== 'ALL') params.set('country', filters.country)
  if (filters.level !== 'ALL') params.set('level', filters.level)
  if (filters.funding !== 'ALL') params.set('funding', filters.funding)
  if (filters.search.trim()) params.set('search', filters.search.trim())
  return `/api/scholarships?${params.toString()}`
}

export function ScholarshipFeed() {
  const [filters, setFilters] = useState<ScholarshipFilterState>(
    DEFAULT_SCHOLARSHIP_FILTERS,
  )

  // Debounce search input so each keystroke doesn't trigger a fetch.
  const [debounced, setDebounced] = useState(filters)
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(filters), 300)
    return () => window.clearTimeout(t)
  }, [filters])

  const getKey = useCallback(
    (index: number, previous: ScholarshipFeedResponse | null) =>
      buildKey(index, previous, debounced),
    [debounced],
  )

  const { data, error, size, setSize, isValidating } =
    useSWRInfinite<ScholarshipFeedResponse>(getKey, fetcher, {
      revalidateFirstPage: false,
      revalidateOnFocus: false,
    })

  const pages = useMemo(() => data ?? [], [data])
  const items = useMemo(() => pages.flatMap((p) => p.items), [pages])
  const total = pages[0]?.total ?? 0
  const configured = pages[0]?.configured ?? true
  const hasMore = items.length < total
  const initialLoading = !data && !error
  const loadingMore =
    size > pages.length && pages.length > 0 && isValidating

  const handleReset = useCallback(() => {
    setFilters(DEFAULT_SCHOLARSHIP_FILTERS)
  }, [])

  // Infinite-scroll sentinel: load the next page once it's near the
  // viewport. Manual button below as a fallback for keyboard users.
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!hasMore || loadingMore) return
    const node = sentinelRef.current
    if (!node) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          void setSize((s) => s + 1)
        }
      },
      { rootMargin: '600px 0px' },
    )
    obs.observe(node)
    return () => obs.disconnect()
  }, [hasMore, loadingMore, setSize])

  return (
    <div className="flex flex-col gap-4">
      <ScholarshipFilters
        state={filters}
        onChange={setFilters}
        onReset={handleReset}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
        <span>
          {`// ${total.toLocaleString('en-US')} result${total === 1 ? '' : 's'}`}
        </span>
        <span>
          {initialLoading
            ? 'loading…'
            : `showing ${items.length}`}
        </span>
      </div>

      {!configured ? (
        <EmptyState
          title="Scholarship feed is being set up."
          description="The data source isn't ready yet  the first sync will populate this page within a few minutes. Check back shortly."
        />
      ) : null}

      {initialLoading ? (
        <div className="grid grid-cols-1 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[6px] border border-[var(--cosmos-critical)] bg-[var(--cosmos-bg-subtle)] p-4 font-mono text-[12px] text-[var(--cosmos-critical)]">
          Failed to load scholarships: {error.message}
        </div>
      ) : null}

      {!initialLoading && configured && items.length === 0 && !error ? (
        <EmptyState
          title="No scholarships match your filters."
          description="Try widening the country, level, or funding filter, or wait for the next sync."
        />
      ) : null}

      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-3">
          {items.map((row) => (
            <ScholarshipCard key={row.id} row={row} />
          ))}
        </div>
      ) : null}

      {hasMore ? (
        <div ref={sentinelRef} className="flex justify-center pt-4">
          <button
            type="button"
            onClick={() => void setSize((s) => s + 1)}
            disabled={loadingMore}
            className="cosmos-btn-ghost disabled:opacity-60"
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
