'use client'

import useSWR from 'swr'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ScholarshipCard } from '@/components/scholarships/ScholarshipCard'
import {
  ScholarshipFilters,
  DEFAULT_SCHOLARSHIP_FILTERS,
  type ScholarshipFilterState,
} from '@/components/scholarships/ScholarshipFilters'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import type { ScholarshipFeedResponse } from '@/app/api/scholarships/route'

const PAGE_SIZE = 20

const fetcher = async (url: string): Promise<ScholarshipFeedResponse> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`scholarships ${res.status}`)
  return res.json()
}

function buildQuery(
  filters: ScholarshipFilterState,
  offset: number,
): string {
  const params = new URLSearchParams({
    limit: String(PAGE_SIZE),
    offset: String(offset),
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
  const [page, setPage] = useState(1)

  // Debounce search input so each keystroke doesn't trigger a fetch.
  const [debounced, setDebounced] = useState(filters)
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(filters), 300)
    return () => window.clearTimeout(t)
  }, [filters])

  // Reset to page 1 + sticky total when filters change. Using the
  // React-canonical "set state during render" pattern so the reset
  // converges on the next render with no intermediate flicker.
  const [trackedFilters, setTrackedFilters] = useState(debounced)
  const [stickyTotal, setStickyTotal] = useState(0)
  if (trackedFilters !== debounced) {
    setTrackedFilters(debounced)
    setPage(1)
    setStickyTotal(0)
  }

  const apiUrl = useMemo(
    () => buildQuery(debounced, (page - 1) * PAGE_SIZE),
    [debounced, page],
  )

  const { data, error, isValidating } = useSWR<ScholarshipFeedResponse>(
    apiUrl,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      keepPreviousData: true,
    },
  )

  // Keep the largest known total across pages: deeper pages may not
  // include an exact count and we don't want the UI to flicker.
  const incomingTotal = data?.total ?? 0
  if (incomingTotal > stickyTotal) setStickyTotal(incomingTotal)
  const total = Math.max(stickyTotal, incomingTotal)
  const configured = data?.configured ?? true
  const items = data?.items ?? []
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const initialLoading = !data && !error
  const refiltering = !!data && isValidating

  const handleReset = () => {
    setFilters(DEFAULT_SCHOLARSHIP_FILTERS)
    setPage(1)
    setStickyTotal(0)
  }

  // Scroll back to the filters card on page change so users land at the
  // top of the new page instead of mid-list.
  const topRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (page === 1) return
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [page])

  return (
    <div ref={topRef} className="flex flex-col gap-4 scroll-mt-24">
      <ScholarshipFilters
        state={filters}
        onChange={setFilters}
        onReset={handleReset}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
        <span>
          {`// ${total.toLocaleString('en-US')} result${total === 1 ? '' : 's'}`}
        </span>
        <span className={refiltering ? 'animate-pulse' : ''}>
          {initialLoading
            ? 'loading…'
            : refiltering
              ? 'updating…'
              : totalPages > 1
                ? `page ${page} / ${totalPages}`
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
            <div key={row.id} className="cosmos-virtual-row">
              <ScholarshipCard row={row} />
            </div>
          ))}
        </div>
      ) : null}

      <Pagination
        page={page}
        totalPages={totalPages}
        onChange={setPage}
        disabled={isValidating && !data}
      />
    </div>
  )
}
