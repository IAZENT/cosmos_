import {
  nvdResponseSchema,
  type CosmosCVE,
  type NVDCve,
  type NVDResponse,
} from '@/types/cve'
import { normalizeSeverity, severityFromScore } from '@/lib/utils/severity'

const NVD_DEFAULT_URL = 'https://services.nvd.nist.gov/rest/json/cves/2.0'

function nvdBaseUrl(): string {
  return process.env.NVD_API_URL?.trim() || NVD_DEFAULT_URL
}

export interface NVDFetchParams {
  resultsPerPage?: number
  startIndex?: number
  pubStartDate?: string
  pubEndDate?: string
  cvssV3Severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  noRejected?: boolean
}

function buildNVDUrl(params: NVDFetchParams): string {
  const search = new URLSearchParams()
  if (params.resultsPerPage != null)
    search.set('resultsPerPage', String(params.resultsPerPage))
  if (params.startIndex != null)
    search.set('startIndex', String(params.startIndex))
  if (params.pubStartDate) search.set('pubStartDate', params.pubStartDate)
  if (params.pubEndDate) search.set('pubEndDate', params.pubEndDate)
  if (params.cvssV3Severity)
    search.set('cvssV3Severity', params.cvssV3Severity)
  if (params.noRejected) search.set('noRejected', '')
  const qs = search.toString()
  const base = nvdBaseUrl()
  return qs.length > 0 ? `${base}?${qs}` : base
}

export async function fetchNVD(
  params: NVDFetchParams = {},
  init: { revalidateSeconds?: number | false; timeoutMs?: number } = {},
): Promise<NVDResponse> {
  const apiKey = process.env.NVD_API_KEY
  const headers: HeadersInit = {
    Accept: 'application/json',
    'User-Agent': 'COSMOS-Platform/1.0 (+https://github.com/)',
  }
  if (apiKey) headers.apiKey = apiKey

  const url = buildNVDUrl(params)
  const fetchInit: RequestInit & { next?: { revalidate: number | false } } = {
    headers,
  }
  if (init.revalidateSeconds === undefined) {
    fetchInit.cache = 'no-store'
  } else {
    fetchInit.next = { revalidate: init.revalidateSeconds }
  }
  // Default 3.5s is tight enough that an unkeyed page render won't stall
  // on NVD's 30s rate-limit window. Bulk-sync callers pass a much higher
  // `timeoutMs` because they fetch up to 2000 rows per request, which
  // takes ~5–15s even on a healthy NVD endpoint.
  const controller = new AbortController()
  const timeout = setTimeout(
    () => controller.abort(),
    init.timeoutMs ?? 3500,
  )
  try {
    const res = await fetch(url, { ...fetchInit, signal: controller.signal })
    if (!res.ok) {
      throw new Error(`NVD fetch failed: ${res.status} ${res.statusText}`)
    }
    const json: unknown = await res.json()
    return nvdResponseSchema.parse(json)
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Pick the most authoritative CVSS metric available on a vulnerability item.
 * Prefers v4.0 → v3.1 → v3.0 → v2 per CVSS currency.
 */
function pickCvssMetric(cve: NVDCve) {
  const m = cve.metrics
  if (!m) return undefined
  return (
    m.cvssMetricV40?.[0] ??
    m.cvssMetricV31?.[0] ??
    m.cvssMetricV30?.[0] ??
    m.cvssMetricV2?.[0]
  )
}

/**
 * Normalise an NVD CVE object into the canonical CosmosCVE shape used in the UI.
 */
export function normalizeNVDCve(cve: NVDCve): CosmosCVE {
  const englishDesc =
    cve.descriptions?.find((d) => d.lang === 'en')?.value ??
    cve.descriptions?.[0]?.value ??
    ''

  const metric = pickCvssMetric(cve)
  const cvssScore = metric?.cvssData?.baseScore ?? null
  const rawSeverity =
    metric?.cvssData?.baseSeverity ??
    (cvssScore != null ? severityFromScore(cvssScore) : null)
  const severity = rawSeverity
    ? normalizeSeverity(rawSeverity)
    : severityFromScore(cvssScore)

  const references = (cve.references ?? []).map((r) => r.url)
  const weaknesses = (cve.weaknesses ?? [])
    .flatMap((w) => w.description ?? [])
    .filter((d) => d.lang === 'en')
    .map((d) => d.value)

  return {
    id: cve.id,
    description: englishDesc,
    cvssScore: cvssScore ?? null,
    cvssVector: metric?.cvssData?.vectorString ?? null,
    cvssVersion: metric?.cvssData?.version ?? null,
    severity,
    publishedAt: cve.published ?? null,
    modifiedAt: cve.lastModified ?? null,
    isKev: Boolean(cve.cisaExploitAdd),
    kevAddedAt: cve.cisaExploitAdd ?? null,
    kevAction: cve.cisaRequiredAction ?? null,
    references,
    weaknesses,
  }
}

/** Sleep helper  used by sync routes to respect NVD rate limits. */
export function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}
