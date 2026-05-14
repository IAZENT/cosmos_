'use client'

import useSWR from 'swr'
import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import {
  EMPTY_VELOCITY,
  type ThreatVelocity as ThreatVelocityData,
} from '@/lib/intel/server-data-types'

const fetcher = async (url: string): Promise<ThreatVelocityData> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`velocity ${res.status}`)
  return (await res.json()) as ThreatVelocityData
}

/**
 * Inline "CVE publish-rate" indicator. Streams from
 * `/api/intelligence/velocity` (60 s edge cache) so the bar never blocks
 * on Supabase. Three visual states:
 *   - flat (0 deltaPct):   ─  RATE: N/hr
 *   - up   (deltaPct > 0):    RATE: N/hr (+X%)
 *   - down (deltaPct < 0):    RATE: N/hr (X%)
 * The parent page is responsible for the "// ELEVATED THREAT ACTIVITY"
 * banner  this component just exposes `data?.elevated` via the hook.
 */
export function ThreatVelocity() {
  const { data } = useSWR<ThreatVelocityData>(
    '/api/intelligence/velocity',
    fetcher,
    {
      fallbackData: EMPTY_VELOCITY,
      refreshInterval: 60_000,
      revalidateOnFocus: false,
      revalidateIfStale: false,
      dedupingInterval: 30_000,
    },
  )
  const v = data ?? EMPTY_VELOCITY

  let Arrow = Minus
  let arrowColor = 'text-[var(--cosmos-text-dim)]'
  if (v.deltaPct > 5) {
    Arrow = ArrowUp
    arrowColor = v.elevated
      ? 'text-[var(--cosmos-critical)]'
      : 'text-[var(--cosmos-high)]'
  } else if (v.deltaPct < -5) {
    Arrow = ArrowDown
    arrowColor = 'text-[var(--cosmos-low)]'
  }

  const sign = v.deltaPct > 0 ? '+' : ''
  return (
    <span
      className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-muted)]"
      title={`${v.ratePerHour} CVE/hr now vs ${v.baseline7dPerHour}/hr 7-day avg`}
    >
      RATE:{' '}
      <span className="text-[var(--cosmos-text)]">{v.ratePerHour}/HR</span>
      <Arrow size={10} className={arrowColor} aria-hidden />
      <span className={arrowColor}>
        {sign}
        {v.deltaPct}%
      </span>
    </span>
  )
}
