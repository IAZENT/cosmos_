// VirusTotal v3 API connector.
//
// Endpoints used:
//   /ip_addresses/{ip}
//   /domains/{domain}
//   /files/{hash}
//   /urls/{base64url(id)}
//
// VT returns a `last_analysis_stats` block with malicious / suspicious /
// harmless / undetected counts. We fold those into a simple verdict +
// 0–100 risk score.

import type { ReportField, SourceReport, Verdict } from '../types'
import { fetchWithTimeout, clamp } from '../util'

type VtStats = {
  malicious?: number
  suspicious?: number
  harmless?: number
  undetected?: number
  timeout?: number
}

type VtAttributes = {
  last_analysis_stats?: VtStats
  reputation?: number
  total_votes?: { harmless?: number; malicious?: number }
  country?: string
  asn?: number
  as_owner?: string
  network?: string
  whois_date?: number
  registrar?: string
  creation_date?: number
  last_modification_date?: number
  meaningful_name?: string
  type_description?: string
  size?: number
  md5?: string
  sha1?: string
  sha256?: string
  url?: string
  title?: string
  final_url?: string
}

type VtResponse = {
  data?: { id?: string; type?: string; attributes?: VtAttributes }
  error?: { code?: string; message?: string }
}

function verdictFromStats(stats?: VtStats): {
  verdict: Verdict
  score: number
} {
  const m = stats?.malicious ?? 0
  const s = stats?.suspicious ?? 0
  const total =
    (stats?.harmless ?? 0) +
    (stats?.undetected ?? 0) +
    m +
    s +
    (stats?.timeout ?? 0)
  if (!total) return { verdict: 'unknown', score: 0 }
  // Score = weighted bad / total, scaled.
  const score = clamp(((m * 1.0 + s * 0.5) / total) * 100, 0, 100)
  if (m >= 5) return { verdict: 'malicious', score }
  if (m >= 1 || s >= 3) return { verdict: 'suspicious', score }
  return { verdict: 'clean', score }
}

function buildStatsFields(stats?: VtStats): ReportField[] {
  if (!stats) return []
  return [
    { label: 'Malicious', value: stats.malicious ?? 0 },
    { label: 'Suspicious', value: stats.suspicious ?? 0 },
    { label: 'Harmless', value: stats.harmless ?? 0 },
    { label: 'Undetected', value: stats.undetected ?? 0 },
  ]
}

async function callVt(path: string): Promise<VtResponse | null> {
  const key = process.env.VIRUSTOTAL_API_KEY
  if (!key) return null
  const res = await fetchWithTimeout(`https://www.virustotal.com/api/v3${path}`, {
    headers: { 'x-apikey': key, accept: 'application/json' },
  })
  // 404 = "not seen by VT" — perfectly normal, return empty data.
  if (res.status === 404) return {}
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as VtResponse | null
    throw new Error(
      body?.error?.message ?? `VirusTotal HTTP ${res.status}`,
    )
  }
  return (await res.json()) as VtResponse
}

function base() {
  return {
    source: 'virustotal' as const,
    label: 'VirusTotal',
  }
}

function unconfigured(): SourceReport {
  return {
    ...base(),
    status: 'unconfigured',
    message: 'Set VIRUSTOTAL_API_KEY in env.',
  }
}

export async function vtIp(ip: string): Promise<SourceReport> {
  if (!process.env.VIRUSTOTAL_API_KEY) return unconfigured()
  const start = Date.now()
  try {
    const json = await callVt(`/ip_addresses/${encodeURIComponent(ip)}`)
    const attrs = json?.data?.attributes
    if (!attrs) {
      return {
        ...base(),
        status: 'no_data',
        durationMs: Date.now() - start,
        reportUrl: `https://www.virustotal.com/gui/ip-address/${ip}`,
        message: 'Not seen by VirusTotal.',
      }
    }
    const { verdict, score } = verdictFromStats(attrs.last_analysis_stats)
    return {
      ...base(),
      status: 'ok',
      verdict,
      score,
      summary: `${attrs.last_analysis_stats?.malicious ?? 0} engines flagged this IP.`,
      reportUrl: `https://www.virustotal.com/gui/ip-address/${ip}`,
      durationMs: Date.now() - start,
      fields: [
        ...buildStatsFields(attrs.last_analysis_stats),
        { label: 'Country', value: attrs.country ?? null },
        { label: 'ASN', value: attrs.asn ?? null },
        { label: 'AS owner', value: attrs.as_owner ?? null },
        { label: 'Network', value: attrs.network ?? null, mono: true },
        { label: 'Reputation', value: attrs.reputation ?? null },
      ],
    }
  } catch (err) {
    return {
      ...base(),
      status: 'error',
      durationMs: Date.now() - start,
      message: err instanceof Error ? err.message : 'VirusTotal failed.',
    }
  }
}

export async function vtDomain(domain: string): Promise<SourceReport> {
  if (!process.env.VIRUSTOTAL_API_KEY) return unconfigured()
  const start = Date.now()
  try {
    const json = await callVt(`/domains/${encodeURIComponent(domain)}`)
    const attrs = json?.data?.attributes
    if (!attrs) {
      return {
        ...base(),
        status: 'no_data',
        durationMs: Date.now() - start,
        reportUrl: `https://www.virustotal.com/gui/domain/${domain}`,
        message: 'Not seen by VirusTotal.',
      }
    }
    const { verdict, score } = verdictFromStats(attrs.last_analysis_stats)
    return {
      ...base(),
      status: 'ok',
      verdict,
      score,
      summary: `${attrs.last_analysis_stats?.malicious ?? 0} engines flagged this domain.`,
      reportUrl: `https://www.virustotal.com/gui/domain/${domain}`,
      durationMs: Date.now() - start,
      fields: [
        ...buildStatsFields(attrs.last_analysis_stats),
        { label: 'Reputation', value: attrs.reputation ?? null },
        { label: 'Registrar', value: attrs.registrar ?? null },
        {
          label: 'Created',
          value: attrs.creation_date
            ? new Date(attrs.creation_date * 1000).toISOString().slice(0, 10)
            : null,
        },
      ],
    }
  } catch (err) {
    return {
      ...base(),
      status: 'error',
      durationMs: Date.now() - start,
      message: err instanceof Error ? err.message : 'VirusTotal failed.',
    }
  }
}

export async function vtHash(hash: string): Promise<SourceReport> {
  if (!process.env.VIRUSTOTAL_API_KEY) return unconfigured()
  const start = Date.now()
  try {
    const json = await callVt(`/files/${encodeURIComponent(hash)}`)
    const attrs = json?.data?.attributes
    if (!attrs) {
      return {
        ...base(),
        status: 'no_data',
        durationMs: Date.now() - start,
        reportUrl: `https://www.virustotal.com/gui/file/${hash}`,
        message: 'Hash not in VirusTotal corpus.',
      }
    }
    const { verdict, score } = verdictFromStats(attrs.last_analysis_stats)
    return {
      ...base(),
      status: 'ok',
      verdict,
      score,
      summary: `${attrs.last_analysis_stats?.malicious ?? 0} AV engines detect this file.`,
      reportUrl: `https://www.virustotal.com/gui/file/${hash}`,
      durationMs: Date.now() - start,
      fields: [
        ...buildStatsFields(attrs.last_analysis_stats),
        { label: 'Type', value: attrs.type_description ?? null },
        { label: 'Name', value: attrs.meaningful_name ?? null },
        {
          label: 'Size',
          value: attrs.size != null ? `${attrs.size} bytes` : null,
        },
        { label: 'SHA-256', value: attrs.sha256 ?? null, mono: true },
        { label: 'MD5', value: attrs.md5 ?? null, mono: true },
      ],
    }
  } catch (err) {
    return {
      ...base(),
      status: 'error',
      durationMs: Date.now() - start,
      message: err instanceof Error ? err.message : 'VirusTotal failed.',
    }
  }
}

/**
 * VirusTotal's URL endpoint requires a base64url-encoded URL identifier
 * (no padding). They return 404 if the URL has never been scanned;
 * we don't trigger a fresh scan here  the dedicated `/tools/urlscan`
 * page handles that.
 */
export async function vtUrl(url: string): Promise<SourceReport> {
  if (!process.env.VIRUSTOTAL_API_KEY) return unconfigured()
  const start = Date.now()
  try {
    const id = Buffer.from(url)
      .toString('base64')
      .replace(/=+$/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
    const json = await callVt(`/urls/${id}`)
    const attrs = json?.data?.attributes
    if (!attrs) {
      return {
        ...base(),
        status: 'no_data',
        durationMs: Date.now() - start,
        message:
          'URL never scanned by VirusTotal. Use the urlscan.io tool to submit.',
      }
    }
    const { verdict, score } = verdictFromStats(attrs.last_analysis_stats)
    return {
      ...base(),
      status: 'ok',
      verdict,
      score,
      summary: `${attrs.last_analysis_stats?.malicious ?? 0} engines flagged this URL.`,
      reportUrl: `https://www.virustotal.com/gui/url/${id}`,
      durationMs: Date.now() - start,
      fields: [
        ...buildStatsFields(attrs.last_analysis_stats),
        { label: 'Title', value: attrs.title ?? null },
        { label: 'Final URL', value: attrs.final_url ?? null },
      ],
    }
  } catch (err) {
    return {
      ...base(),
      status: 'error',
      durationMs: Date.now() - start,
      message: err instanceof Error ? err.message : 'VirusTotal failed.',
    }
  }
}
