'use client'

import useSWR from 'swr'
import { NPTClock } from '@/components/home/NPTClock'
import { ThreatVelocity } from '@/components/home/ThreatVelocity'
import { formatRelative } from '@/lib/utils/date'
import {
  EMPTY_STATS,
  type IntelStatsPayload,
} from '@/types/intel'
import {
  EMPTY_VELOCITY,
  type ThreatVelocity as ThreatVelocityData,
} from '@/lib/intel/server-data-types'

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

  // Probe velocity directly here so the parent bar can render the
  // "// ELEVATED THREAT ACTIVITY" banner. The <ThreatVelocity /> child
  // dedupes against this same SWR key.
  const { data: velocity } = useSWR<ThreatVelocityData>(
    '/api/intelligence/velocity',
    async (url: string) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`velocity ${res.status}`)
      return (await res.json()) as ThreatVelocityData
    },
    {
      fallbackData: EMPTY_VELOCITY,
      refreshInterval: 60_000,
      revalidateOnFocus: false,
      revalidateIfStale: false,
      dedupingInterval: 30_000,
    },
  )
  const elevated = Boolean(velocity?.elevated)

  return (
    <div className="border-b border-[var(--cosmos-border-dim)] bg-[var(--cosmos-bg-elevated)]">
      {elevated ? (
        <div
          role="status"
          aria-live="polite"
          className="border-b border-[var(--cosmos-critical)]/30 bg-[var(--cosmos-critical)]/10"
        >
          <div className="mx-auto flex h-7 max-w-cosmos items-center gap-2 px-4 sm:px-6 md:px-12">
            <span
              aria-hidden
              className="relative flex h-2 w-2"
            >
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--cosmos-critical)] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--cosmos-critical)]" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-critical)]">
              {'// elevated threat activity'}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-muted)]">
              {velocity?.ratePerHour ?? 0} CVE/HR · +{velocity?.deltaPct ?? 0}% vs 7-day avg
            </span>
          </div>
        </div>
      ) : null}
      {/* On mobile the inner row needs to scroll horizontally to fit the
       * sync/kev/clock chips; we anchor the UTC clock with a `min-w-0`
       * outer flex so it never gets pushed off-screen. */}
      <div className="mx-auto flex h-8 max-w-cosmos items-center gap-3 px-4 sm:px-6 md:px-12">
        <div className="cosmos-scroll-x flex min-w-0 flex-1 items-center gap-3 whitespace-nowrap">
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)] sm:inline">
            COSMOS INTELLIGENCE SYSTEM
          </span>
          <span className="hidden sm:inline">
            <Sep />
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-muted)]">
            <Dot on={syncActive} />
            NVD SYNC: {syncActive ? 'ACTIVE' : 'IDLE'}
          </span>
          <Sep />
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-muted)]">
            KEV: {stats.kev_total.toLocaleString('en-US')} ENTRIES
          </span>
          <Sep />
          <ThreatVelocity />
          <span className="hidden md:inline">
            <Sep />
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-muted)] md:inline">
            LAST SYNC: {formatRelative(stats.last_synced_at)}
          </span>
        </div>
        <span className="shrink-0">
          <NPTClock />
        </span>
      </div>
    </div>
  )
}
