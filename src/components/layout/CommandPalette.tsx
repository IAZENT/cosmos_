'use client'

import { Command } from 'cmdk'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import {
  ArrowRight,
  FileText,
  GraduationCap,
  Newspaper,
  Search,
  ShieldAlert,
  Wrench,
} from 'lucide-react'
import type { SearchHit, SearchResponse } from '@/app/api/search/route'

const fetcher = async (url: string): Promise<SearchResponse> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`search ${res.status}`)
  return (await res.json()) as SearchResponse
}

const KIND_LABEL: Record<SearchHit['kind'], string> = {
  page: 'pages',
  tool: 'tools',
  cve: 'cves',
  research: 'research',
  scholarship: 'scholarships',
}

function kindIcon(kind: SearchHit['kind']) {
  const cls = 'shrink-0 text-[var(--cosmos-text-dim)]'
  switch (kind) {
    case 'cve':
      return <ShieldAlert size={14} className={cls} aria-hidden />
    case 'research':
      return <FileText size={14} className={cls} aria-hidden />
    case 'scholarship':
      return <GraduationCap size={14} className={cls} aria-hidden />
    case 'tool':
      return <Wrench size={14} className={cls} aria-hidden />
    case 'page':
    default:
      return <Newspaper size={14} className={cls} aria-hidden />
  }
}

/**
 * Global command palette. Mounted once in the root layout. Triggers:
 *   - Cmd/Ctrl+K
 *   - "/" (when focus is not in an editable field)
 *
 * Search is debounced to 150 ms; payload is fetched via SWR so repeated
 * opens of the palette reuse the cached query.
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [debounced, setDebounced] = useState('')
  const router = useRouter()

  // Global keyboard shortcut.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      const inField =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((v) => !v)
        return
      }
      if (e.key === '/' && !inField && !open) {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // Debounce typed input → query string.
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(input.trim()), 150)
    return () => window.clearTimeout(t)
  }, [input])

  const queryUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (debounced) params.set('q', debounced)
    return `/api/search${params.toString() ? `?${params.toString()}` : ''}`
  }, [debounced])

  const { data } = useSWR<SearchResponse>(open ? queryUrl : null, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
    dedupingInterval: 30_000,
  })

  const grouped = useMemo(() => {
    const out: Record<SearchHit['kind'], SearchHit[]> = {
      cve: [],
      research: [],
      scholarship: [],
      tool: [],
      page: [],
    }
    for (const hit of data?.hits ?? []) out[hit.kind].push(hit)
    return out
  }, [data])

  const onSelect = useCallback(
    (href: string) => {
      setOpen(false)
      setInput('')
      // External-style atom feed: just open in same tab.
      router.push(href)
    },
    [router],
  )

  if (!open) return null

  const order: SearchHit['kind'][] = [
    'cve',
    'research',
    'scholarship',
    'tool',
    'page',
  ]

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false)
      }}
    >
      <div className="mt-[10vh] w-[min(640px,calc(100vw-2rem))] overflow-hidden rounded-[8px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] shadow-xl">
        <Command label="COSMOS command palette" loop>
          <div className="flex items-center gap-2 border-b border-[var(--cosmos-border-dim)] px-4">
            <Search
              size={14}
              className="shrink-0 text-[var(--cosmos-text-dim)]"
              aria-hidden
            />
            <Command.Input
              autoFocus
              value={input}
              onValueChange={setInput}
              placeholder="Search CVEs, research, scholarships, tools…"
              className="h-12 w-full bg-transparent text-[14px] text-[var(--cosmos-text)] outline-none placeholder:text-[var(--cosmos-text-dim)]"
            />
            <kbd className="hidden shrink-0 rounded border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--cosmos-text-muted)] sm:inline-flex">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[60vh] overflow-y-auto p-2">
            <Command.Empty className="px-4 py-10 text-center font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
              {'// no matches'}
            </Command.Empty>

            {order.map((kind) => {
              const items = grouped[kind]
              if (!items || items.length === 0) return null
              return (
                <Command.Group
                  key={kind}
                  heading={KIND_LABEL[kind]}
                  className="cosmos-cmdk-group"
                >
                  {items.map((hit) => (
                    <Command.Item
                      key={hit.id}
                      value={`${hit.kind} ${hit.title} ${hit.subtitle ?? ''} ${hit.id}`}
                      onSelect={() => onSelect(hit.href)}
                      className="flex cursor-pointer items-center gap-3 rounded-[4px] px-3 py-2 data-[selected=true]:bg-[var(--cosmos-bg-subtle)]"
                    >
                      {kindIcon(hit.kind)}
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-[13px] text-[var(--cosmos-text)]">
                          {hit.title}
                        </span>
                        {hit.subtitle ? (
                          <span className="truncate font-mono text-[11px] text-[var(--cosmos-text-muted)]">
                            {hit.subtitle}
                          </span>
                        ) : null}
                      </div>
                      <ArrowRight
                        size={12}
                        className="shrink-0 text-[var(--cosmos-text-dim)]"
                        aria-hidden
                      />
                    </Command.Item>
                  ))}
                </Command.Group>
              )
            })}
          </Command.List>

          <div className="flex items-center justify-between border-t border-[var(--cosmos-border-dim)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
            <span>cosmos · cmd+k</span>
            <span>↵ open · esc close</span>
          </div>
        </Command>
      </div>
    </div>
  )
}
