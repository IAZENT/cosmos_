'use client'

import useSWR from 'swr'
import { UTCClock } from '@/components/home/UTCClock'
import { formatRelative } from '@/lib/utils/date'
import {
  EMPTY_STATS,
  type IntelStatsPayload,
} from '@/types/intel'

function Dot({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={`inline-block h-1.5 w-1.5 rounded-full ${
        on ? 'bg-[var(--cosmos-low)]' : 'bg-[var(--cosmos-text-dim)]'
      }`}
    />
  )
}

function Sep() {
  return <span className="text-[var(--cosmos-text-dim)]">·</span>
}

const fetcher = async (url: string): Promise<IntelStatsPayload> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`stats ${res.status}`)
  const json = (await res.json()) as Partial<IntelStatsPayload>
  return { ...EMPTY_STATS, last_synced_at: null, ...json }
}

const FALLBACK: IntelStatsPayload = { ...EMPTY_STATS, last_synced_at: null }

/**
 * Top status bar shown on every page. Originally this was an async Server
 * Component which blocked SSR on Supabase + (worst case) rate-limited NVD
 * round-trips  adding 2–6s to every navigation. It's now client-side with
 * a single SWR fetch from `/api/intelligence/stats` (cached
 * `s-maxage=300, swr=600` at the edge), so SSR never waits on intel data.
 */
export function IntelStatusBar() {
  const { data } = useSWR<IntelStatsPayload>(
    '/api/intelligence/stats',
    fetcher,
    {
      fallbackData: FALLBACK,
      refreshInterval: 60_000,
      revalidateOnFocus: false,
      revalidateIfStale: false,
      dedupingInterval: 30_000,
    },
  )

  const stats = data ?? FALLBACK
  const syncActive = Boolean(stats.last_synced_at)

  return (
    <div className="border-b border-[var(--cosmos-border-dim)] bg-[var(--cosmos-bg-elevated)]">
      <div className="mx-auto flex h-8 max-w-cosmos items-center gap-3 px-6 md:px-12">
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)] sm:inline">
          COSMOS INTELLIGENCE SYSTEM
        </span>
        <Sep />
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-muted)]">
          <Dot on={syncActive} />
          NVD SYNC: {syncActive ? 'ACTIVE' : 'IDLE'}
        </span>
        <Sep />
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-muted)]">
          KEV: {stats.kev_total.toLocaleString('en-US')} ENTRIES
        </span>
        <Sep />
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-muted)] md:inline">
          LAST SYNC: {formatRelative(stats.last_synced_at)}
        </span>
        <span className="ml-auto">
          <UTCClock />
        </span>
      </div>
    </div>
  )
}
