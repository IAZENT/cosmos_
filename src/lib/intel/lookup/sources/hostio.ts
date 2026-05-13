// host.io connector — domain intel: DNS, web, related domains.
// Endpoint: GET https://host.io/api/full/{domain}?token=...

import type { SourceReport } from '../types'
import { fetchWithTimeout } from '../util'

type HostIoFull = {
  domain?: string
  web?: {
    domain?: string
    rank?: number
    url?: string
    ip?: string
    title?: string
    description?: string
    server?: string
    copyright?: string
    encoding?: string
    length?: number
  }
  dns?: {
    a?: string[]
    aaaa?: string[]
    mx?: string[]
    ns?: string[]
    txt?: string[]
  }
  ipinfo?: Record<string, { country?: string; asn?: { name?: string } }>
  related?: {
    ip?: { value?: string; count?: number }
    asn?: { value?: string; count?: number }
    ns?: { value?: string; count?: number }
    mx?: { value?: string; count?: number }
    backlinks?: { value?: number; count?: number }
    redirect?: { value?: string; count?: number }
  }
}

const base = { source: 'hostio' as const, label: 'host.io' }

export async function hostIoFull(domain: string): Promise<SourceReport> {
  const key = process.env.HOSTIO_API_KEY
  if (!key) {
    return {
      ...base,
      status: 'unconfigured',
      message: 'Set HOSTIO_API_KEY in env.',
    }
  }
  const start = Date.now()
  try {
    const res = await fetchWithTimeout(
      `https://host.io/api/full/${encodeURIComponent(domain)}?token=${key}`,
    )
    if (res.status === 404) {
      return {
        ...base,
        status: 'no_data',
        durationMs: Date.now() - start,
        reportUrl: `https://host.io/${domain}`,
        message: 'host.io has no record for this domain.',
      }
    }
    if (!res.ok) throw new Error(`host.io HTTP ${res.status}`)
    const json = (await res.json()) as HostIoFull
    const dns = json.dns ?? {}
    const web = json.web ?? {}
    return {
      ...base,
      status: 'ok',
      summary:
        web.title ?? `DNS resolved with ${(dns.a ?? []).length} A record(s).`,
      reportUrl: `https://host.io/${domain}`,
      durationMs: Date.now() - start,
      fields: [
        { label: 'Title', value: web.title ?? null },
        { label: 'Server', value: web.server ?? null },
        { label: 'Web rank', value: web.rank ?? null },
        {
          label: 'A records',
          value: (dns.a ?? []).slice(0, 4).join(', ') || '—',
          mono: true,
        },
        {
          label: 'AAAA',
          value: (dns.aaaa ?? []).slice(0, 2).join(', ') || '—',
          mono: true,
        },
        {
          label: 'MX',
          value: (dns.mx ?? []).slice(0, 4).join(', ') || '—',
          mono: true,
        },
        {
          label: 'NS',
          value: (dns.ns ?? []).slice(0, 4).join(', ') || '—',
          mono: true,
        },
        {
          label: 'TXT',
          value: (dns.txt ?? []).slice(0, 2).join(' · ') || '—',
        },
        {
          label: 'Backlinks',
          value: json.related?.backlinks?.value ?? null,
        },
        {
          label: 'Domains on same IP',
          value: json.related?.ip?.count ?? null,
        },
      ],
    }
  } catch (err) {
    return {
      ...base,
      status: 'error',
      durationMs: Date.now() - start,
      message: err instanceof Error ? err.message : 'host.io failed.',
    }
  }
}
