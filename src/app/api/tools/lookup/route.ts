// Unified threat-lookup API.
// POST { q: string } → fans out to every relevant source and returns
// a normalized `LookupResponse`.
//
// All upstream API keys live server-side in env. The response never
// leaks them. We don't cache here  every call is a fresh fan-out.

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { runLookup } from '@/lib/intel/lookup/aggregate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  q: z.string().trim().min(1).max(2048),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Provide { q: string } in the body.' },
      { status: 400 },
    )
  }
  try {
    const result = await runLookup(parsed.data.q)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lookup failed.' },
      { status: 500 },
    )
  }
}
