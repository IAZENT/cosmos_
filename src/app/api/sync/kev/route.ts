import { NextResponse } from 'next/server'
import { requireCronSecret } from '@/lib/api/sync-auth'
import { runKevSync } from '@/lib/sync/runners'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function handle(request: Request) {
  const authFailure = requireCronSecret(request)
  if (authFailure) return authFailure

  const outcome = await runKevSync()
  if (!outcome.ok) {
    return NextResponse.json({ error: outcome.error.message }, { status: 503 })
  }
  return NextResponse.json(outcome.result)
}

export const GET = handle
export const POST = handle
