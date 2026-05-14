import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  id: z.string().uuid(),
})

/**
 * POST /api/arsenal/usage  { id }
 *
 * Increments arsenal_entries.usage_count and the global total_copies stat
 * via a SECURITY DEFINER RPC. Public  anonymous visitors can record a
 * copy event.
 */
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 })
  }
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.json({ ok: false }, { status: 200 })
  }
  try {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.rpc('increment_arsenal_usage', {
      entry_id: parsed.data.id,
    })
    if (error) return NextResponse.json({ ok: false }, { status: 200 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
