import { NextResponse } from 'next/server'
import { z } from 'zod'
import { listArsenal } from '@/lib/arsenal/server-data'
import type { ArsenalSuggestResponse } from '@/types/arsenal'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const querySchema = z.object({
  q: z.string().trim().min(1).max(200),
})

export async function GET(request: Request) {
  const url = new URL(request.url)
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams))
  if (!parsed.success) {
    return NextResponse.json(
      { items: [] } satisfies ArsenalSuggestResponse,
      { status: 200 },
    )
  }
  const { entries } = await listArsenal({ q: parsed.data.q, limit: 8 })
  const items = entries.map((e) => ({
    id: e.id,
    title: e.title,
    category: e.category,
    difficulty: e.difficulty,
    platform: e.platform,
    commandPreview: (e.command ?? '').replace(/\s+/g, ' ').slice(0, 80),
  }))
  return NextResponse.json(
    { items } satisfies ArsenalSuggestResponse,
    { headers: { 'cache-control': 'no-store' } },
  )
}
