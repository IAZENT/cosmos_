import { NextResponse } from 'next/server'
import { requireCronSecret } from '@/lib/api/sync-auth'
import { runCveSync } from '@/lib/sync/runners'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const authFailure = requireCronSecret(request)
  if (authFailure) return authFailure

  const outcome = await runCveSync()
  if (!outcome.ok) {
    return NextResponse.json({ error: outcome.error.message }, { status: 503 })
  }
  return NextResponse.json(outcome.result)
}
