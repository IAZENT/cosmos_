import { NextResponse } from 'next/server'
import {
  EMPTY_VELOCITY,
  getThreatVelocityServer,
} from '@/lib/intel/server-data'

export const runtime = 'nodejs'
// 60 s edge cache + 5 min SWR  hot enough that homepage hits never wait
// on Supabase, cold enough that the rate "feels" live.
export const revalidate = 60

export async function GET() {
  const velocity = await getThreatVelocityServer().catch(() => ({
    ...EMPTY_VELOCITY,
    computedAt: new Date().toISOString(),
  }))
  return NextResponse.json(velocity, {
    headers: {
      'cache-control': 's-maxage=60, stale-while-revalidate=300',
    },
  })
}
