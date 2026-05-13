import { NextResponse } from 'next/server'
import {
  getIntelStatsServer,
  getLastSyncedAtServer,
} from '@/lib/intel/server-data'
import { EMPTY_STATS, type IntelStatsPayload } from '@/types/intel'

export const runtime = 'nodejs'
export const revalidate = 300

export async function GET() {
  // Both helpers are cached via React `cache()` and individually fall back
  // to direct upstreams on cold cache, with a strict 2.5s timeout each.
  // Worst case the response returns zeros instead of hanging the request.
  const [stats, lastSynced] = await Promise.all([
    getIntelStatsServer().catch(() => ({ ...EMPTY_STATS })),
    getLastSyncedAtServer().catch(() => null),
  ])

  const payload: IntelStatsPayload = { ...stats, last_synced_at: lastSynced }
  return NextResponse.json(payload, {
    headers: {
      'cache-control': 's-maxage=300, stale-while-revalidate=600',
    },
  })
}
