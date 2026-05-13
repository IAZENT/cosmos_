// AbuseIPDB v2 connector — IP-only.
// Endpoint: GET https://api.abuseipdb.com/api/v2/check?ipAddress=...

import type { SourceReport, Verdict } from '../types'
import { fetchWithTimeout, clamp } from '../util'

type AbuseIpdbResponse = {
  data?: {
    ipAddress?: string
    isPublic?: boolean
    ipVersion?: number
    isWhitelisted?: boolean | null
    abuseConfidenceScore?: number
    countryCode?: string
    countryName?: string
    usageType?: string
    isp?: string
    domain?: string
    hostnames?: string[]
    isTor?: boolean
    totalReports?: number
    numDistinctUsers?: number
    lastReportedAt?: string | null
  }
  errors?: Array<{ detail?: string }>
}

function verdictFromConfidence(confidence: number): Verdict {
  if (confidence >= 75) return 'malicious'
  if (confidence >= 25) return 'suspicious'
  if (confidence > 0) return 'suspicious'
  return 'clean'
}

export async function abuseIpdbCheck(ip: string): Promise<SourceReport> {
  const base = { source: 'abuseipdb' as const, label: 'AbuseIPDB' }
  const key = process.env.ABUSEIPDB_API_KEY
  if (!key) {
    return {
      ...base,
      status: 'unconfigured',
      message: 'Set ABUSEIPDB_API_KEY in env.',
    }
  }
  const start = Date.now()
  try {
    const res = await fetchWithTimeout(
      `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90&verbose`,
      { headers: { Key: key, Accept: 'application/json' } },
    )
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as
        | AbuseIpdbResponse
        | null
      throw new Error(
        body?.errors?.[0]?.detail ?? `AbuseIPDB HTTP ${res.status}`,
      )
    }
    const json = (await res.json()) as AbuseIpdbResponse
    const d = json.data
    if (!d) {
      return {
        ...base,
        status: 'no_data',
        durationMs: Date.now() - start,
      }
    }
    const confidence = d.abuseConfidenceScore ?? 0
    return {
      ...base,
      status: 'ok',
      verdict: verdictFromConfidence(confidence),
      score: clamp(confidence, 0, 100),
      summary: `Abuse confidence ${confidence}% — ${d.totalReports ?? 0} reports from ${d.numDistinctUsers ?? 0} distinct reporters.`,
      reportUrl: `https://www.abuseipdb.com/check/${ip}`,
      durationMs: Date.now() - start,
      fields: [
        { label: 'Abuse confidence', value: `${confidence}%` },
        { label: 'Total reports', value: d.totalReports ?? 0 },
        { label: 'Distinct reporters', value: d.numDistinctUsers ?? 0 },
        { label: 'Last reported', value: d.lastReportedAt ?? null },
        { label: 'Country', value: d.countryName ?? d.countryCode ?? null },
        { label: 'ISP', value: d.isp ?? null },
        { label: 'Usage type', value: d.usageType ?? null },
        { label: 'Domain', value: d.domain ?? null, mono: true },
        { label: 'Tor exit node', value: d.isTor ? 'yes' : 'no' },
        {
          label: 'Whitelisted',
          value: d.isWhitelisted == null ? null : d.isWhitelisted ? 'yes' : 'no',
        },
      ],
    }
  } catch (err) {
    return {
      ...base,
      status: 'error',
      durationMs: Date.now() - start,
      message: err instanceof Error ? err.message : 'AbuseIPDB failed.',
    }
  }
}
