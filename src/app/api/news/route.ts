import { NextResponse } from 'next/server'
import { fetchNewsBundle } from '@/lib/api/news'

export const runtime = 'nodejs'
// Refresh on the server every 5 min; SWR for another 10 min so the
// next user gets the cached payload while a background refresh runs.
export const revalidate = 300

export async function GET() {
  const bundle = await fetchNewsBundle()
  return NextResponse.json(bundle, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  })
}
