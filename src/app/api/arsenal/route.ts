import { NextResponse } from 'next/server'
import { z } from 'zod'
import { listArsenal } from '@/lib/arsenal/server-data'
import {
  ARSENAL_CATEGORIES,
  ARSENAL_DIFFICULTIES,
  ARSENAL_PLATFORMS,
  ARSENAL_USE_CASES,
} from '@/lib/arsenal/constants'

export const runtime = 'nodejs'
export const revalidate = 60

const querySchema = z.object({
  q: z.string().trim().max(200).optional().default(''),
  category: z.enum(['all', ...ARSENAL_CATEGORIES]).optional().default('all'),
  platform: z.enum(['all', ...ARSENAL_PLATFORMS]).optional().default('all'),
  difficulty: z.enum(['all', ...ARSENAL_DIFFICULTIES]).optional().default('all'),
  use_case: z.enum(['all', ...ARSENAL_USE_CASES]).optional().default('all'),
  pinned: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(100),
  offset: z.coerce.number().int().min(0).max(10_000).optional().default(0),
})

export async function GET(request: Request) {
  const url = new URL(request.url)
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams))
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid query', details: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const { q, category, platform, difficulty, use_case, pinned, limit, offset } =
    parsed.data
  const { entries, total } = await listArsenal({
    q,
    category,
    platform,
    difficulty,
    use_case,
    pinned: pinned === undefined ? undefined : pinned === 'true',
    limit,
    offset,
  })
  return NextResponse.json({ entries, total })
}
