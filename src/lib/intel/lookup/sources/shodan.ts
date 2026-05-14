// Shodan connector. Two endpoints used:
//   /shodan/host/{ip}         banners + services
//   /dns/resolve?hostnames=   domain → IP, used for domain lookups
//
// We don't reach for `/shodan/host/{ip}` on domains automatically: that
// would consume two query credits per lookup. Instead we resolve the
// domain and surface the resolved IPs as actionable links.

import type { SourceReport } from '../types'
import { fetchWithTimeout } from '../util'

type ShodanHost = {
  ip_str?: string
  org?: string
  isp?: string
  asn?: string
  os?: string | null
  hostnames?: string[]
  domains?: string[]
  ports?: number[]
  country_name?: string
  country_code?: string
  city?: string
  last_update?: string
  tags?: string[]
  vulns?: string[]
  data?: Array<{ port?: number; transport?: string; product?: string }>
}

const baseInfo = { source: 'shodan' as const, label: 'Shodan' }

function unconfigured(): SourceReport {
  return {
    ...baseInfo,
    status: 'unconfigured',
    message: 'Set SHODAN_API_KEY in env.',
  }
}

export async function shodanHost(ip: string): Promise<SourceReport> {
  const key = process.env.SHODAN_API_KEY
  if (!key) return unconfigured()
  const start = Date.now()
  try {
    const res = await fetchWithTimeout(
      `https://api.shodan.io/shodan/host/${encodeURIComponent(ip)}?key=${key}`,
    )
    if (res.status === 404) {
      return {
        ...baseInfo,
        status: 'no_data',
        durationMs: Date.now() - start,
        reportUrl: `https://www.shodan.io/host/${ip}`,
        message: 'Shodan has no banners for this IP.',
      }
    }
    if (!res.ok) {
      throw new Error(`Shodan HTTP ${res.status}`)
    }
    const json = (await res.json()) as ShodanHost
    const ports = json.ports ?? []
    const vulns = json.vulns ?? []
    return {
      ...baseInfo,
      status: 'ok',
      verdict: vulns.length > 0 ? 'suspicious' : 'unknown',
      score: vulns.length > 0 ? Math.min(60, 30 + vulns.length * 3) : 0,
      summary: `${ports.length} open ports, ${vulns.length} known vulns indexed.`,
      reportUrl: `https://www.shodan.io/host/${ip}`,
      durationMs: Date.now() - start,
      fields: [
        { label: 'Open ports', value: ports.length ? ports.join(', ') : '' },
        {
          label: 'Vulns',
          value: vulns.length ? vulns.slice(0, 8).join(', ') : '',
          mono: true,
        },
        { label: 'Org', value: json.org ?? null },
        { label: 'ISP', value: json.isp ?? null },
        { label: 'ASN', value: json.asn ?? null },
        { label: 'OS', value: json.os ?? null },
        {
          label: 'Location',
          value: [json.city, json.country_name].filter(Boolean).join(', ') || null,
        },
        {
          label: 'Hostnames',
          value: json.hostnames?.slice(0, 4).join(', ') || null,
        },
        { label: 'Last update', value: json.last_update ?? null },
      ],
    }
  } catch (err) {
    return {
      ...baseInfo,
      status: 'error',
      durationMs: Date.now() - start,
      message: err instanceof Error ? err.message : 'Shodan failed.',
    }
  }
}

export async function shodanResolveDomain(
  domain: string,
): Promise<SourceReport> {
  const key = process.env.SHODAN_API_KEY
  if (!key) return unconfigured()
  const start = Date.now()
  try {
    const res = await fetchWithTimeout(
      `https://api.shodan.io/dns/resolve?hostnames=${encodeURIComponent(domain)}&key=${key}`,
    )
    if (!res.ok) throw new Error(`Shodan HTTP ${res.status}`)
    const json = (await res.json()) as Record<string, string>
    const ip = json[domain]
    if (!ip) {
      return {
        ...baseInfo,
        status: 'no_data',
        durationMs: Date.now() - start,
      }
    }
    return {
      ...baseInfo,
      status: 'ok',
      summary: `Resolved to ${ip} via Shodan DNS.`,
      reportUrl: `https://www.shodan.io/host/${ip}`,
      durationMs: Date.now() - start,
      fields: [
        { label: 'Resolved A', value: ip, mono: true },
        { label: 'Domain', value: domain, mono: true },
      ],
    }
  } catch (err) {
    return {
      ...baseInfo,
      status: 'error',
      durationMs: Date.now() - start,
      message: err instanceof Error ? err.message : 'Shodan failed.',
    }
  }
}
