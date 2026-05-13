// Aggregates live security news from multiple upstreams in parallel.
//
// Sources:
// - International cyber news: The Hacker News, BleepingComputer, Krebs
//   (RSS, no auth required).
// - Nepal tech / cyber news: TechLekh, OnlineKhabar tech (RSS).
// - Threat intel pulses: AlienVault OTX (`OTX_API_KEY` /
//   `ALIENVAULT_OTX_KEY` from `.env`).
// - Phishing URLs: OpenPhish public feed (`OPENPHISH_FEED_URL`).
//
// urlscan.io is intentionally NOT a news source  it lives in
// `/tools/urlscan` as an on-demand scanner.
//
// Every upstream is wrapped in an AbortController so a single slow
// source can't stall the page. Anything that errors returns an empty
// array  the page degrades gracefully.

export type NewsItem = {
  id: string
  title: string
  url: string
  summary: string | null
  source: string
  published_at: string | null // ISO
  category: 'international' | 'nepal' | 'pulse' | 'phish'
  severity?: 'critical' | 'high' | 'medium' | 'low' | null
}

const DEFAULT_TIMEOUT_MS = 6000

async function timedFetch(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<Response> {
  const controller = new AbortController()
  const t = setTimeout(
    () => controller.abort(),
    init.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  )
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'User-Agent': 'COSMOS-Platform/1.0 (+https://github.com/)',
        Accept: init.headers
          ? ((init.headers as Record<string, string>).Accept ??
            'application/json, text/xml, */*')
          : 'application/json, text/xml, */*',
        ...(init.headers as Record<string, string> | undefined),
      },
    })
  } finally {
    clearTimeout(t)
  }
}

/* ------------------------------------------------------------------ */
/* RSS / Atom parser                                                  */
/* ------------------------------------------------------------------ */

// Minimal RSS 2.0 + Atom 1.0 parser. We avoid pulling in `fast-xml-parser`
// because every feed we hit is a flat <item>/<entry> list and a regex
// scan is faster + dependency-free.

const ITEM_RE = /<item\b[\s\S]*?<\/item>/gi
const ENTRY_RE = /<entry\b[\s\S]*?<\/entry>/gi
const TAG_RE = (tag: string) =>
  new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')

function stripCdata(s: string): string {
  return s
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .trim()
}

function stripTags(s: string): string {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function matchTag(block: string, tag: string): string | null {
  const m = block.match(TAG_RE(tag))
  return m ? stripCdata(m[1] ?? '') : null
}

function parseFeed(
  xml: string,
  source: string,
  category: NewsItem['category'],
): NewsItem[] {
  const items = xml.match(ITEM_RE) ?? xml.match(ENTRY_RE) ?? []
  return items
    .map((block): NewsItem | null => {
      const title = matchTag(block, 'title')
      let url = matchTag(block, 'link')
      // Atom feeds put the URL in <link href="…"/> not text content.
      if (!url || /^\s*$/.test(url)) {
        const m = block.match(/<link\b[^>]*href=["']([^"']+)["']/i)
        if (m) url = m[1] ?? null
      }
      const pubDate =
        matchTag(block, 'pubDate') ??
        matchTag(block, 'published') ??
        matchTag(block, 'updated') ??
        matchTag(block, 'dc:date')
      const description =
        matchTag(block, 'description') ??
        matchTag(block, 'summary') ??
        matchTag(block, 'content:encoded') ??
        matchTag(block, 'content')
      if (!title || !url) return null
      let published_at: string | null = null
      if (pubDate) {
        const d = new Date(pubDate)
        if (!Number.isNaN(d.getTime())) published_at = d.toISOString()
      }
      return {
        id: url,
        title: stripTags(title),
        url: stripTags(url),
        summary: description ? stripTags(description).slice(0, 280) : null,
        source,
        published_at,
        category,
      }
    })
    .filter((v): v is NewsItem => v !== null)
}

async function fetchRss(
  url: string,
  source: string,
  category: NewsItem['category'],
): Promise<NewsItem[]> {
  try {
    const res = await timedFetch(url, {
      headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
    })
    if (!res.ok) return []
    const xml = await res.text()
    return parseFeed(xml, source, category)
  } catch {
    return []
  }
}

/* ------------------------------------------------------------------ */
/* AlienVault OTX                                                     */
/* ------------------------------------------------------------------ */

type OtxPulse = {
  id: string
  name: string
  description?: string
  created?: string
  modified?: string
  tags?: string[]
  TLP?: string
  industries?: string[]
  targeted_countries?: string[]
}

async function fetchOtxPulses(limit = 12): Promise<NewsItem[]> {
  const apiKey =
    process.env.OTX_API_KEY?.trim() ||
    process.env.ALIENVAULT_OTX_KEY?.trim() ||
    null
  if (!apiKey) return []
  try {
    const res = await timedFetch(
      `https://otx.alienvault.com/api/v1/pulses/subscribed?limit=${limit}`,
      { headers: { 'X-OTX-API-KEY': apiKey, Accept: 'application/json' } },
    )
    if (!res.ok) return []
    const json = (await res.json()) as { results?: OtxPulse[] }
    return (json.results ?? []).map((p) => ({
      id: `otx:${p.id}`,
      title: p.name,
      url: `https://otx.alienvault.com/pulse/${p.id}`,
      summary: p.description?.slice(0, 280) ?? null,
      source: 'AlienVault OTX',
      published_at: p.created ?? p.modified ?? null,
      category: 'pulse' as const,
    }))
  } catch {
    return []
  }
}

/* ------------------------------------------------------------------ */
/* OpenPhish                                                          */
/* ------------------------------------------------------------------ */

async function fetchOpenPhish(limit = 15): Promise<NewsItem[]> {
  const url = process.env.OPENPHISH_FEED_URL?.trim()
  if (!url) return []
  try {
    const res = await timedFetch(url, {
      headers: { Accept: 'text/plain' },
    })
    if (!res.ok) return []
    const text = await res.text()
    // OpenPhish feed = newline-separated URLs (one per line).
    const urls = text
      .split(/\r?\n/)
      .map((u) => u.trim())
      .filter((u) => u.startsWith('http'))
      .slice(0, limit)
    const now = new Date().toISOString()
    return urls.map((u) => {
      let host = u
      try {
        host = new URL(u).hostname
      } catch {
        /* keep raw */
      }
      return {
        id: `phish:${u}`,
        title: host,
        url: u,
        summary: 'Newly observed phishing URL.',
        source: 'OpenPhish',
        published_at: now,
        category: 'phish' as const,
        severity: 'high' as const,
      }
    })
  } catch {
    return []
  }
}

/* ------------------------------------------------------------------ */
/* Public entry                                                       */
/* ------------------------------------------------------------------ */

const INTERNATIONAL_FEEDS: { url: string; source: string }[] = [
  {
    url: 'https://feeds.feedburner.com/TheHackersNews',
    source: 'The Hacker News',
  },
  {
    url: 'https://www.bleepingcomputer.com/feed/',
    source: 'BleepingComputer',
  },
  { url: 'https://krebsonsecurity.com/feed/', source: 'Krebs on Security' },
  {
    url: 'https://www.darkreading.com/rss.xml',
    source: 'Dark Reading',
  },
]

const NEPAL_FEEDS: { url: string; source: string }[] = [
  { url: 'https://www.techlekh.com/feed/', source: 'TechLekh' },
  {
    url: 'https://english.onlinekhabar.com/feed',
    source: 'OnlineKhabar',
  },
  {
    url: 'https://www.techsathi.com/feed/',
    source: 'TechSathi',
  },
]

export type NewsBundle = {
  international: NewsItem[]
  nepal: NewsItem[]
  pulses: NewsItem[]
  phish: NewsItem[]
  fetched_at: string
}

export async function fetchNewsBundle(): Promise<NewsBundle> {
  const [intlChunks, nepalChunks, pulses, phish] = await Promise.all([
    Promise.all(
      INTERNATIONAL_FEEDS.map((f) =>
        fetchRss(f.url, f.source, 'international'),
      ),
    ),
    Promise.all(
      NEPAL_FEEDS.map((f) => fetchRss(f.url, f.source, 'nepal')),
    ),
    fetchOtxPulses(),
    fetchOpenPhish(),
  ])

  const sortByDate = (a: NewsItem, b: NewsItem) =>
    (b.published_at ?? '').localeCompare(a.published_at ?? '')

  const dedupe = (items: NewsItem[]): NewsItem[] => {
    const seen = new Set<string>()
    return items.filter((it) => {
      if (seen.has(it.id)) return false
      seen.add(it.id)
      return true
    })
  }

  return {
    international: dedupe(intlChunks.flat()).sort(sortByDate).slice(0, 30),
    nepal: dedupe(nepalChunks.flat()).sort(sortByDate).slice(0, 20),
    pulses: dedupe(pulses).sort(sortByDate).slice(0, 15),
    phish: dedupe(phish).slice(0, 15),
    fetched_at: new Date().toISOString(),
  }
}
