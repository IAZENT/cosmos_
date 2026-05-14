import { NextResponse } from 'next/server'
import { z } from 'zod'

// Server-side proxy for urlscan.io. The API key never reaches the
// browser. Two operations:
//   POST /api/tools/urlscan          → submit a URL for scanning, returns { uuid, resultUrl }
//   GET  /api/tools/urlscan?uuid=... → poll for a finished result
//
// urlscan.io scans are async  submit takes ~1s, but the verdict
// usually needs another 5–15s to render. The browser polls.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const submitSchema = z.object({
  url: z
    .string()
    .trim()
    .min(4)
    .max(2048)
    .refine((v) => {
      try {
        const parsed = new URL(v)
        return parsed.protocol === 'http:' || parsed.protocol === 'https:'
      } catch {
        return false
      }
    }, 'Must be an http(s) URL.'),
  visibility: z.enum(['public', 'unlisted']).optional().default('public'),
})

function getApiKey(): string | null {
  return process.env.URLSCAN_API_KEY?.trim() || null
}

export async function POST(request: Request) {
  const apiKey = getApiKey()
  if (!apiKey) {
    return NextResponse.json(
      { error: 'urlscan.io scanning is not configured (set URLSCAN_API_KEY).' },
      { status: 503 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }
  const parsed = submitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input.', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const res = await fetch('https://urlscan.io/api/v1/scan/', {
      method: 'POST',
      headers: {
        'API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: parsed.data.url,
        visibility: parsed.data.visibility,
      }),
    })
    const data = (await res.json()) as {
      uuid?: string
      result?: string
      api?: string
      message?: string
      description?: string
    }
    if (!res.ok || !data.uuid) {
      // urlscan returns `message` + `description` on rejection (e.g.
      // domain blacklisted, rate-limited, malformed).
      return NextResponse.json(
        {
          error:
            data.description ?? data.message ?? `urlscan submit failed (${res.status})`,
        },
        { status: res.status === 429 ? 429 : 502 },
      )
    }
    return NextResponse.json({
      uuid: data.uuid,
      resultUrl: data.result ?? `https://urlscan.io/result/${data.uuid}/`,
      apiUrl: data.api ?? `https://urlscan.io/api/v1/result/${data.uuid}/`,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Submit failed.' },
      { status: 502 },
    )
  }
}

export async function GET(request: Request) {
  const apiKey = getApiKey()
  if (!apiKey) {
    return NextResponse.json(
      { error: 'urlscan.io scanning is not configured.' },
      { status: 503 },
    )
  }
  const url = new URL(request.url)
  const uuid = url.searchParams.get('uuid')?.trim()
  if (!uuid || !/^[0-9a-f-]{32,40}$/i.test(uuid)) {
    return NextResponse.json({ error: 'Invalid uuid.' }, { status: 400 })
  }

  try {
    const res = await fetch(`https://urlscan.io/api/v1/result/${uuid}/`, {
      headers: { 'API-Key': apiKey },
    })
    // 404 is the "not ready yet" signal  keep polling on the client.
    if (res.status === 404) {
      return NextResponse.json({ status: 'pending' }, { status: 200 })
    }
    if (!res.ok) {
      return NextResponse.json(
        { error: `urlscan result failed (${res.status})` },
        { status: 502 },
      )
    }
    const data = (await res.json()) as {
      task?: { url?: string; uuid?: string; time?: string; reportURL?: string }
      page?: {
        url?: string
        domain?: string
        ip?: string
        country?: string
        server?: string
      }
      verdicts?: {
        overall?: { malicious?: boolean; score?: number; categories?: string[] }
        urlscan?: { malicious?: boolean; score?: number }
      }
      stats?: { uniqIPs?: number; uniqDomains?: number; requests?: number }
      lists?: { ips?: string[]; domains?: string[]; countries?: string[] }
    }
    return NextResponse.json({
      status: 'done',
      submittedUrl: data.task?.url ?? null,
      finalUrl: data.page?.url ?? null,
      domain: data.page?.domain ?? null,
      ip: data.page?.ip ?? null,
      country: data.page?.country ?? null,
      server: data.page?.server ?? null,
      time: data.task?.time ?? null,
      reportUrl:
        data.task?.reportURL ?? `https://urlscan.io/result/${uuid}/`,
      screenshotUrl: `https://urlscan.io/screenshots/${uuid}.png`,
      malicious: data.verdicts?.overall?.malicious ?? false,
      score: data.verdicts?.overall?.score ?? null,
      categories: data.verdicts?.overall?.categories ?? [],
      stats: {
        uniqIPs: data.stats?.uniqIPs ?? 0,
        uniqDomains: data.stats?.uniqDomains ?? 0,
        requests: data.stats?.requests ?? 0,
      },
      countries: data.lists?.countries ?? [],
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Result fetch failed.' },
      { status: 502 },
    )
  }
}
