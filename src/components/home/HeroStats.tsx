'use client'

import useSWR from 'swr'
import { StatCounter } from '@/components/home/StatCounter'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { EMPTY_STATS, type IntelStats } from '@/types/intel'

const fetcher = async (url: string): Promise<IntelStats> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`stats ${res.status}`)
  const json = (await res.json()) as Partial<IntelStats>
  return { ...EMPTY_STATS, ...json }
}

export function HeroStats({ initial }: { initial: IntelStats }) {
  const { data, isLoading } = useSWR<IntelStats>(
    '/api/intelligence/stats',
    fetcher,
    {
      fallbackData: initial,
      refreshInterval: 60_000,
      revalidateOnFocus: false,
    },
  )

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-start gap-4 md:items-end">
        <LoadingSkeleton className="h-10 w-40" />
        <LoadingSkeleton className="h-10 w-32" />
        <LoadingSkeleton className="h-10 w-32" />
      </div>
    )
  }

  const stats = data ?? initial
  return (
    <div className="flex flex-col items-start gap-8 md:items-end">
      <StatCounter
        value={stats.total_cves_tracked}
        label="CVEs tracked"
        className="md:items-end"
      />
      <StatCounter
        value={stats.critical_cves_24h}
        label="Critical · 24h"
        className="md:items-end"
      />
      <StatCounter
        value={stats.kev_total}
        label="KEV entries"
        className="md:items-end"
      />
    </div>
  )
}
