import { NextResponse } from 'next/server'

/**
 * Verify an incoming sync request carries the shared CRON_SECRET.
 * Returns null when OK, or a 401 NextResponse to return immediately.
 */
export function requireCronSecret(request: Request): NextResponse | null {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    return NextResponse.json(
      { error: 'CRON_SECRET not configured on server.' },
      { status: 503 },
    )
  }
  const header = request.headers.get('authorization') ?? ''
  const token = header.toLowerCase().startsWith('bearer ')
    ? header.slice('bearer '.length).trim()
    : null
  if (!token || token !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

/**
 * True when Supabase env is available. Sync routes return a 503 with a
 * clear message when it isn't, rather than throwing.
 */
export function supabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  )
}
