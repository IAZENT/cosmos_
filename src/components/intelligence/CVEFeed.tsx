'use client'

import useSWRInfinite from 'swr/infinite'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CVECard } from '@/components/intelligence/CVECard'
import {
  CVEFilters,
  DEFAULT_FILTER_STATE,
  type CVEFilterState,
} from '@/components/intelligence/CVEFilters'
import { CVEDetailModal } from '@/components/intelligence/CVEDetailModal'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import type {
  CVEFeedResponse,
  CVEFeedRow,
} from '@/app/api/intelligence/cves/route'

const PAGE_SIZE = 20

const fetcher = async (url: string): Promise<CVEFeedResponse> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`cves ${res.status}`)
  return (await res.json()) as CVEFeedResponse
}

function buildQuery(filters: CVEFilterState, offset: number): string {
  const params = new URLSearchParams()
  params.set('limit', String(PAGE_SIZE))
  params.set('offset', String(offset))
  if (filters.severity !== 'ALL') params.set('severity', filters.severity)
  if (filters.kevOnly) params.set('kevOnly', 'true')
  if (filters.search.trim()) params.set('search', filters.search.trim())
  if (filters.from) {
    params.set('from', new Date(`${filters.from}T00:00:00Z`).toISOString())
  }
  if (filters.to) {
    params.set('to', new Date(`${filters.to}T23:59:59Z`).toISOString())
  }
  return `/api/intelligence/cves?${params.toString()}`
}

export function CVEFeed() {
  const [filters, setFilters] = useState<CVEFilterState>(DEFAULT_FILTER_STATE)
  const [selected, setSelected] = useState<CVEFeedRow | null>(null)

  // Debounce the search input so we don't spam the API on every keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search)
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(filters.search), 300)
    return () => window.clearTimeout(id)
  }, [filters.search])
  const effectiveFilters = useMemo(
    () => ({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch],
  )

  const getKey = useCallback(
    (index: number, prev: CVEFeedResponse | null) => {
      if (prev && prev.items.length < PAGE_SIZE) return null
      return buildQuery(effectiveFilters, index * PAGE_SIZE)
    },
    [effectiveFilters],
  )

  const { data, error, isValidating, size, setSize, mutate } =
    useSWRInfinite<CVEFeedResponse>(getKey, fetcher, {
      revalidateFirstPage: false,
      revalidateOnFocus: false,
      revalidateIfStale: false,
      keepPreviousData: true,
      dedupingInterval: 5_000,
    })

  const pages = data ?? []
  const items = pages.flatMap((p) => p.items)
  // Some pages (paged fetches) don't carry a count; surface the largest
  // total we've seen so the UI doesn't shrink while paginating.
  const total = pages.reduce((max, p) => Math.max(max, p.total ?? 0), 0)
  const hasMore =
    items.length < total ||
    (pages.length > 0 && pages[pages.length - 1]!.items.length === PAGE_SIZE)
  const loadingMore = isValidating && pages.length > 0 && !data?.[size - 1]
  const initialLoading = !data && !error
  const refiltering = !!data && isValidating && size === 1

  const handleReset = () => {
    setFilters(DEFAULT_FILTER_STATE)
    setDebouncedSearch('')
    setSize(1)
    void mutate()
  }

  // Reset pagination when filters change.
  useEffect(() => {
    setSize(1)
  }, [effectiveFilters, setSize])

  // Auto-load the next page when the sentinel scrolls into view. Falls back
  // gracefully on browsers without IntersectionObserver  the explicit
  // "Load more" button below remains as a manual trigger.
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const node = sentinelRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    if (!hasMore || loadingMore || isValidating) return
    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting) setSize((s) => s + 1)
      },
      { rootMargin: '600px 0px' },
    )
    obs.observe(node)
    return () => obs.disconnect()
  }, [hasMore, loadingMore, isValidating, setSize])

  return (
    <div className="flex flex-col gap-4">
      <CVEFilters
        state={filters}
        onChange={setFilters}
        onReset={handleReset}
      />

      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
        <span>
          {`// ${total.toLocaleString('en-US')} result${total === 1 ? '' : 's'}`}
        </span>
        <span className={refiltering ? 'animate-pulse' : ''}>
          {refiltering ? 'updating…' : `showing ${items.length}`}
        </span>
      </div>

      {initialLoading ? (
        <div className="grid grid-cols-1 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : null}

      {error ? (
        <EmptyState
          title="Failed to load CVEs."
          description={
            error instanceof Error ? error.message : 'Unknown error'
          }
        />
      ) : null}

      {!initialLoading && !error && items.length === 0 ? (
        <EmptyState
          title="No CVEs match the current filters."
          description="Try broadening the severity filter, clearing the search, or adjusting the date range."
        />
      ) : null}

      <div className="grid grid-cols-1 gap-3">
        {items.map((cve) => (
          <CVECard key={cve.id} cve={cve} onSelect={setSelected} />
        ))}
      </div>

      {hasMore ? (
        <>
          {/* Sentinel watched by IntersectionObserver for auto-pagination. */}
          <div ref={sentinelRef} aria-hidden className="h-px w-full" />
          <button
            type="button"
            onClick={() => setSize(size + 1)}
            disabled={loadingMore}
            className="cosmos-btn-ghost mx-auto mt-6 disabled:opacity-60"
          >
            {loadingMore ? 'loading…' : '→ Load more'}
          </button>
        </>
      ) : null}

      <CVEDetailModal cve={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
