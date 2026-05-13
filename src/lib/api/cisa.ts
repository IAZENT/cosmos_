import {
  cisaKevResponseSchema,
  type CISAKevResponse,
} from '@/types/cve'

const CISA_KEV_DEFAULT_URL =
  'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json'

function cisaKevUrl(): string {
  return process.env.CISA_KEV_URL?.trim() || CISA_KEV_DEFAULT_URL
}

export async function fetchCISAKev(
  init: { revalidateSeconds?: number; timeoutMs?: number } = {},
): Promise<CISAKevResponse> {
  // The KEV JSON is ~1 MB; on a cold edge cache it can take 1–2s. Cap at
  // 4s so a single slow upstream never stalls the page.
  const controller = new AbortController()
  const timeout = setTimeout(
    () => controller.abort(),
    init.timeoutMs ?? 4000,
  )
  try {
    const res = await fetch(cisaKevUrl(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'COSMOS-Platform/1.0 (+https://github.com/)',
      },
      next: { revalidate: init.revalidateSeconds ?? 60 * 60 * 6 },
      signal: controller.signal,
    })
    if (!res.ok) {
      throw new Error(`CISA KEV fetch failed: ${res.status} ${res.statusText}`)
    }
    const json: unknown = await res.json()
    return cisaKevResponseSchema.parse(json)
  } finally {
    clearTimeout(timeout)
  }
}
