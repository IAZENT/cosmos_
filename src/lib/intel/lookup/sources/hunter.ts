// Hunter.io connector. Two modes:
//   - email:  /v2/email-verifier?email=...
//   - domain: /v2/domain-search?domain=...&limit=10

import type { SourceReport, Verdict } from '../types'
import { fetchWithTimeout } from '../util'

type HunterVerify = {
  data?: {
    status?: string // 'valid' | 'invalid' | 'accept_all' | 'webmail' | 'disposable' | 'unknown'
    result?: string
    email?: string
    score?: number
    regexp?: boolean
    gibberish?: boolean
    disposable?: boolean
    webmail?: boolean
    mx_records?: boolean
    smtp_server?: boolean
    smtp_check?: boolean
    accept_all?: boolean
    block?: boolean
    sources?: Array<{ domain?: string; uri?: string }>
  }
  errors?: Array<{ details?: string }>
}

type HunterDomain = {
  data?: {
    domain?: string
    organization?: string
    country?: string
    state?: string
    pattern?: string | null
    webmail?: boolean
    disposable?: boolean
    accept_all?: boolean
    emails?: Array<{
      value?: string
      first_name?: string | null
      last_name?: string | null
      position?: string | null
      confidence?: number
      type?: string
    }>
  }
  meta?: { results?: number }
  errors?: Array<{ details?: string }>
}

const base = { source: 'hunter' as const, label: 'Hunter.io' }

function unconfigured(): SourceReport {
  return {
    ...base,
    status: 'unconfigured',
    message: 'Set HUNTER_API_KEY in env.',
  }
}

function verdictFromVerify(data: NonNullable<HunterVerify['data']>): Verdict {
  if (data.disposable) return 'suspicious'
  const status = data.status ?? data.result
  if (status === 'invalid' || data.block) return 'malicious'
  if (status === 'valid') return 'clean'
  return 'unknown'
}

export async function hunterVerify(email: string): Promise<SourceReport> {
  const key = process.env.HUNTER_API_KEY
  if (!key) return unconfigured()
  const start = Date.now()
  try {
    const res = await fetchWithTimeout(
      `https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(email)}&api_key=${key}`,
    )
    const json = (await res.json()) as HunterVerify
    if (!res.ok || !json.data) {
      throw new Error(
        json.errors?.[0]?.details ?? `Hunter HTTP ${res.status}`,
      )
    }
    const d = json.data
    const verdict = verdictFromVerify(d)
    return {
      ...base,
      status: 'ok',
      verdict,
      score:
        verdict === 'malicious' || verdict === 'suspicious'
          ? Math.max(40, 100 - (d.score ?? 0))
          : 0,
      summary: `${d.status ?? d.result ?? 'unknown'} · score ${d.score ?? 0}/100`,
      durationMs: Date.now() - start,
      fields: [
        { label: 'Status', value: d.status ?? d.result ?? null },
        { label: 'Score', value: d.score ?? null },
        { label: 'MX records', value: d.mx_records ? 'yes' : 'no' },
        { label: 'SMTP server', value: d.smtp_server ? 'yes' : 'no' },
        { label: 'SMTP check', value: d.smtp_check ? 'yes' : 'no' },
        { label: 'Accept-all', value: d.accept_all ? 'yes' : 'no' },
        { label: 'Disposable', value: d.disposable ? 'yes' : 'no' },
        { label: 'Webmail', value: d.webmail ? 'yes' : 'no' },
        { label: 'Gibberish', value: d.gibberish ? 'yes' : 'no' },
        { label: 'Block', value: d.block ? 'yes' : 'no' },
        { label: 'Sources found', value: d.sources?.length ?? 0 },
      ],
    }
  } catch (err) {
    return {
      ...base,
      status: 'error',
      durationMs: Date.now() - start,
      message: err instanceof Error ? err.message : 'Hunter failed.',
    }
  }
}

export async function hunterDomain(domain: string): Promise<SourceReport> {
  const key = process.env.HUNTER_API_KEY
  if (!key) return unconfigured()
  const start = Date.now()
  try {
    const res = await fetchWithTimeout(
      `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&limit=10&api_key=${key}`,
    )
    const json = (await res.json()) as HunterDomain
    if (!res.ok || !json.data) {
      throw new Error(
        json.errors?.[0]?.details ?? `Hunter HTTP ${res.status}`,
      )
    }
    const d = json.data
    const emails = d.emails ?? []
    const top = emails.slice(0, 5).map((e) => e.value).filter(Boolean) as string[]
    return {
      ...base,
      status: 'ok',
      summary: `${json.meta?.results ?? emails.length} public emails on this domain.`,
      reportUrl: `https://hunter.io/search/${domain}`,
      durationMs: Date.now() - start,
      fields: [
        { label: 'Organisation', value: d.organization ?? null },
        { label: 'Pattern', value: d.pattern ?? null, mono: true },
        { label: 'Country', value: d.country ?? null },
        { label: 'Webmail', value: d.webmail ? 'yes' : 'no' },
        { label: 'Disposable', value: d.disposable ? 'yes' : 'no' },
        { label: 'Accept-all', value: d.accept_all ? 'yes' : 'no' },
        {
          label: 'Top emails',
          value: top.length ? top.join(' · ') : '',
          mono: true,
        },
      ],
    }
  } catch (err) {
    return {
      ...base,
      status: 'error',
      durationMs: Date.now() - start,
      message: err instanceof Error ? err.message : 'Hunter failed.',
    }
  }
}
