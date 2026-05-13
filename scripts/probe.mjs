#!/usr/bin/env node
// Probe the live Supabase project: report which tables exist, how many
// rows are in each, and (if cve_cache is empty) trigger the sync.
//
// Run: node --env-file=.env scripts/probe.mjs

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const CRON = process.env.CRON_SECRET
const APP = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

if (!URL || !KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` }

async function countRows(table) {
  const r = await fetch(
    `${URL}/rest/v1/${table}?select=*&limit=0`,
    { headers: { ...headers, Prefer: 'count=exact' } },
  )
  if (!r.ok) return { exists: false, error: `${r.status} ${await r.text()}` }
  const range = r.headers.get('content-range') ?? '0'
  return { exists: true, count: Number(range.split('/').pop() || 0) }
}

async function severityBreakdown() {
  const sevs = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
  const out = {}
  for (const s of sevs) {
    const r = await fetch(
      `${URL}/rest/v1/cve_cache?select=*&cvss_severity=eq.${s}&limit=0`,
      { headers: { ...headers, Prefer: 'count=exact' } },
    )
    out[s] = r.ok ? Number((r.headers.get('content-range') ?? '0').split('/').pop() || 0) : 'error'
  }
  return out
}

console.log('--- Supabase tables ---')
for (const t of ['cve_cache', 'intel_stats', 'resources', 'research_posts']) {
  const r = await countRows(t)
  console.log(`${t.padEnd(16)} ${r.exists ? `${r.count} rows` : `MISSING (${r.error})`}`)
}

const cve = await countRows('cve_cache')
if (cve.exists && cve.count > 0) {
  console.log('\n--- cve_cache severity breakdown ---')
  console.log(await severityBreakdown())
}

console.log('\n--- NVD key probe ---')
const nvd = await fetch(
  'https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=1',
  { headers: process.env.NVD_API_KEY ? { apiKey: process.env.NVD_API_KEY } : {} },
)
console.log(
  `NVD ${nvd.status} ${nvd.statusText} · key=${process.env.NVD_API_KEY ? 'present' : 'absent'}`,
)

if (cve.exists && cve.count === 0 && CRON) {
  console.log('\n--- cve_cache empty: triggering sync ---')
  const r = await fetch(`${APP}/api/sync/cve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${CRON}` },
  })
  console.log(`POST /api/sync/cve → ${r.status}`)
  console.log((await r.text()).slice(0, 400))

  const r2 = await fetch(`${APP}/api/sync/kev`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${CRON}` },
  })
  console.log(`POST /api/sync/kev → ${r2.status}`)
  console.log((await r2.text()).slice(0, 400))
}
