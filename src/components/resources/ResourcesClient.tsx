'use client'

import { ExternalLink, Search, X } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { TrustRating } from '@/components/ui/TrustRating'
import { EmptyState } from '@/components/ui/EmptyState'
import { RESOURCE_CATEGORIES } from '@/lib/content/categories'
import type { ResourceRow } from '@/types/supabase'

export function ResourcesClient({
  initialItems,
}: {
  initialItems: ResourceRow[]
}) {
  const searchId = useId()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'ALL' | string>('ALL')

  const categoriesInUse = useMemo(() => {
    const set = new Set<string>()
    for (const r of initialItems) {
      if (r.category) set.add(r.category)
    }
    // Preserve spec order, then append any stragglers not in the canonical list.
    const ordered: string[] = []
    for (const c of RESOURCE_CATEGORIES) if (set.has(c)) ordered.push(c)
    for (const c of set) if (!ordered.includes(c)) ordered.push(c)
    return ordered
  }, [initialItems])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return initialItems.filter((r) => {
      if (category !== 'ALL' && r.category !== category) return false
      if (!q) return true
      return (
        r.title.toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q))
      )
    })
  }, [initialItems, category, query])

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCategory('ALL')}
            className={cn(
              'rounded-[4px] border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors',
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
                'rounded-[4px] border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors',
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
              Search resources
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
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Title, tag, or keyword"
                className="w-[16rem] bg-transparent font-mono text-[12px] text-[var(--cosmos-text)] placeholder:text-[var(--cosmos-text-dim)] focus:outline-none"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
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
        {`// ${filtered.length.toLocaleString('en-US')} ${filtered.length === 1 ? 'entry' : 'entries'}`}
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          title={
            initialItems.length === 0
              ? 'No resources published yet.'
              : 'No resources match the current filters.'
          }
          description={
            initialItems.length === 0
              ? 'Admins can add entries from /admin/resources.'
              : 'Try a different category or clear the search.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filtered.map((r) => (
            <article
              key={r.id}
              className="flex flex-col gap-3 rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-5 transition-colors hover:border-[var(--cosmos-text-dim)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {r.category ? (
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-code)]">
                      {`// ${r.category.toLowerCase()}`}
                    </p>
                  ) : null}
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block truncate text-[16px] text-[var(--cosmos-text)] hover:text-[var(--cosmos-accent)]"
                  >
                    {r.title}
                  </a>
                </div>
                <TrustRating rating={r.trust_rating} />
              </div>
              {r.description ? (
                <p className="text-[13px] leading-relaxed text-[var(--cosmos-text-muted)]">
                  {r.description}
                </p>
              ) : null}
              {r.personal_note ? (
                <p className="border-l-2 border-[var(--cosmos-accent-dim)] pl-3 text-[12px] italic leading-relaxed text-[var(--cosmos-text-dim)]">
                  {r.personal_note}
                </p>
              ) : null}
              {r.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {r.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-[var(--cosmos-border)] px-2 py-[2px] font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--cosmos-text-muted)]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex items-center gap-1.5 font-mono text-[11px] text-[var(--cosmos-accent)] hover:underline"
              >
                <ExternalLink size={11} aria-hidden />
                <span className="max-w-full truncate">{r.url}</span>
              </a>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
