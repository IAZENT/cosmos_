// urlscan.io connector — search the public corpus for prior scans of
// the queried URL or domain. Fast, no submit. The "Submit fresh scan"
// flow is exposed as an inline action on the result card and uses the
// existing /api/tools/urlscan route.

import type { SourceReport, Verdict } from '../types'
import { fetchWithTimeout } from '../util'

type UrlscanHit = {
  task?: { url?: string; time?: string; uuid?: string; domain?: string }
  page?: {
    url?: string
    domain?: string
    ip?: string
    country?: string
    server?: string
  }
  verdicts?: {
    overall?: { malicious?: boolean; score?: number; categories?: string[] }
  }
  result?: string
  screenshot?: string
}

type UrlscanSearchResponse = {
  results?: UrlscanHit[]
  total?: number
  has_more?: boolean
  message?: string
  description?: string
}

const base = { source: 'urlscan' as const, label: 'urlscan.io' }

function escapeForQuery(value: string): string {
  // urlscan's Lucene-style query DSL — escape quotes and backslashes.
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

async function search(
  q: string,
  apiKey: string | null,
): Promise<UrlscanSearchResponse> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (apiKey) headers['API-Key'] = apiKey
  const res = await fetchWithTimeout(
    `https://urlscan.io/api/v1/search/?q=${encodeURIComponent(q)}&size=5`,
    { headers },
  )
  const json = (await res.json().catch(() => ({}))) as UrlscanSearchResponse
  if (!res.ok) {
    throw new Error(
      json.description ?? json.message ?? `urlscan HTTP ${res.status}`,
    )
  }
  return json
}

function summarize(
  hits: UrlscanHit[],
): { verdict: Verdict; score: number; maliciousCount: number } {
  if (hits.length === 0) return { verdict: 'unknown', score: 0, maliciousCount: 0 }
  const malicious = hits.filter((h) => h.verdicts?.overall?.malicious).length
  const top = hits[0]
  const topScore = top?.verdicts?.overall?.score ?? 0
  if (malicious > 0) {
    return { verdict: 'malicious', score: Math.max(60, topScore), maliciousCount: malicious }
  }
  if (topScore > 30) {
    return { verdict: 'suspicious', score: topScore, maliciousCount: 0 }
  }
  return { verdict: 'clean', score: 0, maliciousCount: 0 }
}

async function run(query: string, label: string): Promise<SourceReport> {
  const apiKey = process.env.URLSCAN_API_KEY ?? null
  // urlscan.io's search endpoint is open without a key, but rate-limited
  // more aggressively. We pass the key when present.
  const start = Date.now()
  try {
    const json = await search(query, apiKey)
    const hits = json.results ?? []
    const { verdict, score, maliciousCount } = summarize(hits)
    const top = hits[0]
    const topUuid = top?.task?.uuid ?? null
    const report: SourceReport = {
      ...base,
      status: hits.length === 0 ? 'no_data' : 'ok',
      score: hits.length === 0 ? null : score,
      summary:
        hits.length === 0
          ? `No prior public scans for this ${label}.`
          : `${hits.length} recent scan${hits.length === 1 ? '' : 's'} · ${maliciousCount} flagged malicious.`,
      reportUrl: topUuid
        ? `https://urlscan.io/result/${topUuid}/`
        : `https://urlscan.io/search/#${encodeURIComponent(query)}`,
      durationMs: Date.now() - start,
      fields:
        hits.length === 0
          ? []
          : [
              { label: 'Recent scans', value: hits.length },
              { label: 'Flagged malicious', value: maliciousCount },
              {
                label: 'Top verdict score',
                value: top?.verdicts?.overall?.score ?? null,
              },
              {
                label: 'Top hit URL',
                value: top?.page?.url ?? top?.task?.url ?? null,
                mono: true,
              },
              {
                label: 'Top hit IP',
                value: top?.page?.ip ?? null,
                mono: true,
              },
              {
                label: 'Top hit country',
                value: top?.page?.country ?? null,
              },
              {
                label: 'Top hit time',
                value: top?.task?.time ?? null,
              },
              {
                label: 'Categories',
                value:
                  top?.verdicts?.overall?.categories?.slice(0, 3).join(', ') ||
                  null,
              },
            ],
    }
    if (hits.length > 0) report.verdict = verdict
    return report
  } catch (err) {
    return {
      ...base,
      status: 'error',
      durationMs: Date.now() - start,
      message: err instanceof Error ? err.message : 'urlscan failed.',
    }
  }
}

export async function urlscanSearchUrl(url: string): Promise<SourceReport> {
  return run(`page.url:"${escapeForQuery(url)}"`, 'URL')
}

export async function urlscanSearchDomain(domain: string): Promise<SourceReport> {
  return run(`page.domain:"${escapeForQuery(domain)}"`, 'domain')
}
