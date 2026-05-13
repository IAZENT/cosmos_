import { NextResponse } from 'next/server'
import { requireCronSecret } from '@/lib/api/sync-auth'
import { runScholarshipsSync } from '@/lib/scholarships/sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

async function handle(request: Request) {
  const authFailure = requireCronSecret(request)
  if (authFailure) return authFailure

  const result = await runScholarshipsSync()
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 503 })
  }
  return NextResponse.json(result)
}

// Vercel cron uses GET; manual / GitHub Actions runs use POST.
export const GET = handle
export const POST = handle
