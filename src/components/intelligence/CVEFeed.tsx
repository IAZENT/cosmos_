'use client'

import useSWR from 'swr'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CVECard } from '@/components/intelligence/CVECard'
import {
  CVEFilters,
  DEFAULT_FILTER_STATE,
  type CVEFilterState,
} from '@/components/intelligence/CVEFilters'
import { CVEDetailModal } from '@/components/intelligence/CVEDetailModal'
import { SaveSearchButton } from '@/components/intelligence/SaveSearchButton'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import type { SavedSearchFilters } from '@/types/saved-search'
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
  const [page, setPage] = useState(1)

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

  // Reset to page 1 + sticky total whenever the active filters change.
  // Using the React-canonical "set state during render" pattern so
  // these resets converge on the very next render rather than after an
  // intermediate one (which would briefly show the wrong page/total).
  const [trackedFilters, setTrackedFilters] = useState(effectiveFilters)
  const [stickyTotal, setStickyTotal] = useState(0)
  if (trackedFilters !== effectiveFilters) {
    setTrackedFilters(effectiveFilters)
    setPage(1)
    setStickyTotal(0)
  }

  const apiUrl = useMemo(
    () => buildQuery(effectiveFilters, (page - 1) * PAGE_SIZE),
    [effectiveFilters, page],
  )

  const { data, error, isValidating, mutate } = useSWR<CVEFeedResponse>(
    apiUrl,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      keepPreviousData: true,
      dedupingInterval: 5_000,
    },
  )

  // Cache the largest total we've seen across pages: the API only returns
  // an exact count on offset=0, so deeper pages would otherwise flicker
  // between the real total and 0.
  const incomingTotal = data?.total ?? 0
  if (incomingTotal > stickyTotal) setStickyTotal(incomingTotal)
  const total = Math.max(stickyTotal, incomingTotal)

  const items = data?.items ?? []
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const initialLoading = !data && !error
  const refiltering = !!data && isValidating

  const handleReset = () => {
    setFilters(DEFAULT_FILTER_STATE)
    setDebouncedSearch('')
    setPage(1)
    setStickyTotal(0)
    void mutate()
  }

  // Scroll the feed back to its top whenever the page changes so users
  // aren't dropped into the middle of the new page after clicking "next".
  // We anchor on the filters card, not window-scroll, to avoid jumping
  // past navbar/intel-status bar.
  const topRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (page === 1) return
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [page])

  return (
    <div ref={topRef} className="flex flex-col gap-4 scroll-mt-24">
      <CVEFilters
        state={filters}
        onChange={setFilters}
        onReset={handleReset}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
        <span>
          {`// ${total.toLocaleString('en-US')} result${total === 1 ? '' : 's'}`}
        </span>
        <div className="flex items-center gap-3">
          <SaveSearchButton
            filters={effectiveFilters satisfies SavedSearchFilters}
          />
          <span className={refiltering ? 'animate-pulse' : ''}>
            {refiltering
              ? 'updating…'
              : totalPages > 1
                ? `page ${page} / ${totalPages}`
                : `showing ${items.length}`}
          </span>
        </div>
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
          <div key={cve.id} className="cosmos-virtual-row">
            <CVECard cve={cve} onSelect={setSelected} />
          </div>
        ))}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onChange={setPage}
        disabled={isValidating && !data}
      />

      <CVEDetailModal cve={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
