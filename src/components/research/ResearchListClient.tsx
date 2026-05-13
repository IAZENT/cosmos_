'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { Search, X } from 'lucide-react'
import { useEffect, useId, useMemo, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { RESEARCH_CATEGORIES } from '@/lib/content/categories'
import { formatUTC } from '@/lib/utils/date'
import type { ResearchPostRow } from '@/types/supabase'
import type { ResearchSearchResponse } from '@/app/api/research/search/route'

const fetcher = async (url: string): Promise<ResearchSearchResponse> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`research ${res.status}`)
  return (await res.json()) as ResearchSearchResponse
}

export function ResearchListClient({
  initialItems,
}: {
  initialItems: ResearchPostRow[]
}) {
  const searchId = useId()
  const [queryInput, setQueryInput] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'ALL' | string>('ALL')

  useEffect(() => {
    const id = window.setTimeout(() => setQuery(queryInput), 250)
    return () => window.clearTimeout(id)
  }, [queryInput])

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (category !== 'ALL') params.set('category', category)
    params.set('limit', '50')
    return `/api/research/search?${params.toString()}`
  }, [query, category])

  const fallback: ResearchSearchResponse = {
    items: initialItems,
    mode: 'none',
  }

  const skip = !query.trim() && category === 'ALL'

  const { data, isLoading, error } = useSWR<ResearchSearchResponse>(
    skip ? null : apiUrl,
    fetcher,
    skip
      ? { fallbackData: fallback, revalidateOnFocus: false }
      : { revalidateOnFocus: false },
  )

  const activeItems = skip ? initialItems : data?.items ?? []

  const categoriesInUse = useMemo(() => {
    const set = new Set<string>()
    for (const p of initialItems) {
      if (p.category) set.add(p.category)
    }
    const ordered: string[] = []
    for (const c of RESEARCH_CATEGORIES) if (set.has(c)) ordered.push(c)
    for (const c of set) if (!ordered.includes(c)) ordered.push(c)
    return ordered
  }, [initialItems])

  const mode = skip ? 'cached' : (data?.mode ?? 'searching')

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCategory('ALL')}
            className={cn(
              'rounded-[4px] border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em]',
              category === 'ALL'
                ? 'border-[var(--cosmos-accent)] text-[var(--cosmos-accent)]'
                : 'border-[var(--cosmos-border)] text-[var(--cosmos-text-muted)] hover:text-[var(--cosmos-text)]',
            )}
          >
            ALL
          </button>
          {categoriesInUse.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                'rounded-[4px] border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em]',
                category === c
                  ? 'border-[var(--cosmos-accent)] text-[var(--cosmos-accent)]'
                  : 'border-[var(--cosmos-border)] text-[var(--cosmos-text-muted)] hover:text-[var(--cosmos-text)]',
              )}
            >
              {c}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <label htmlFor={searchId} className="sr-only">
              Search research
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
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Full-text search…"
                className="w-[16rem] bg-transparent font-mono text-[12px] text-[var(--cosmos-text)] placeholder:text-[var(--cosmos-text-dim)] focus:outline-none"
              />
              {queryInput ? (
                <button
                  type="button"
                  onClick={() => setQueryInput('')}
                  aria-label="Clear search"
                  className="text-[var(--cosmos-text-dim)] hover:text-[var(--cosmos-text)]"
                >
                  <X size={12} />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
        {`// ${activeItems.length.toLocaleString('en-US')} ${activeItems.length === 1 ? 'post' : 'posts'} · mode: ${mode}`}
      </p>

      {isLoading && !data ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          title="Search failed."
          description={error instanceof Error ? error.message : 'Unknown error'}
        />
      ) : activeItems.length === 0 ? (
        <EmptyState
          title={
            query.trim() || category !== 'ALL'
              ? 'No posts match the current filters.'
              : 'No research published yet.'
          }
          description={
            query.trim() || category !== 'ALL'
              ? 'Try a different category or clear the search.'
              : 'Admins can author posts from /admin/research.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {activeItems.map((p) => (
            <Link
              key={p.id}
              href={`/research/${p.slug}`}
              className="group flex flex-col gap-3 rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-5 transition-colors hover:border-[var(--cosmos-text-dim)]"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-code)]">
                  {`// ${(p.category ?? 'research').toLowerCase()}`}
                </p>
                <span className="font-mono text-[10px] text-[var(--cosmos-text-dim)]">
                  {formatUTC(p.published_at)}
                </span>
              </div>
              <h2 className="text-[20px] leading-[1.2] text-[var(--cosmos-text)] group-hover:text-[var(--cosmos-accent)]">
                {p.title}
              </h2>
              {p.summary ? (
                <p className="text-[13px] leading-relaxed text-[var(--cosmos-text-muted)]">
                  {p.summary}
                </p>
              ) : null}
              {p.tags.length > 0 || p.mitre_techniques.length > 0 ? (
                <div className="mt-auto flex flex-wrap gap-1.5">
                  {p.mitre_techniques.slice(0, 4).map((t) => (
                    <span
                      key={`mitre-${t}`}
                      className="rounded-full border border-[var(--cosmos-accent-dim)] px-2 py-[2px] font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--cosmos-accent)]"
                    >
                      {t}
                    </span>
                  ))}
                  {p.tags.slice(0, 4).map((t) => (
                    <span
                      key={`tag-${t}`}
                      className="rounded-full border border-[var(--cosmos-border)] px-2 py-[2px] font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--cosmos-text-muted)]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
