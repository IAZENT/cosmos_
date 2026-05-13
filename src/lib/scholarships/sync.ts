import { createServiceRoleClient } from '@/lib/supabase/server'
import { supabaseConfigured } from '@/lib/api/sync-auth'
import {
  fetchEuraxess,
  fetchRssSource,
  type RawNewsItem,
} from '@/lib/scholarships/parse'
import { SCHOLARSHIP_SOURCES } from '@/lib/scholarships/sources'
import { tagAll } from '@/lib/scholarships/tag'

export interface ScholarshipSyncResult {
  ok: true
  durationMs: number
  fetched: number
  upserted: number
  perSource: Array<{ source: string; items: number; error: string | null }>
  errors: string[]
}

export type ScholarshipSyncOutcome =
  | ScholarshipSyncResult
  | { ok: false; error: string }

/**
 * Drop items whose URL is already in the upsert batch (last-write-wins
 * is fine, but Supabase will reject the whole upsert if two rows share
 * the unique key in a single call).
 */
function dedupByUrl(items: RawNewsItem[]): RawNewsItem[] {
  const seen = new Set<string>()
  const out: RawNewsItem[] = []
  for (const it of items) {
    if (seen.has(it.sourceUrl)) continue
    seen.add(it.sourceUrl)
    out.push(it)
  }
  return out
}

export async function runScholarshipsSync(): Promise<ScholarshipSyncOutcome> {
  if (!supabaseConfigured()) {
    return {
      ok: false,
      error: 'Supabase service role not configured.',
    }
  }
  const start = Date.now()
  const errors: string[] = []
  const perSource: ScholarshipSyncResult['perSource'] = []
  const all: RawNewsItem[] = []

  // Fetch every source in parallel. We don't bail on individual failures.
  await Promise.all(
    SCHOLARSHIP_SOURCES.map(async (src) => {
      const result =
        src.kind === 'rss'
          ? await fetchRssSource(src.name, src.url)
          : await fetchEuraxess()
      perSource.push({
        source: src.name,
        items: result.items.length,
        error: result.error ?? null,
      })
      if (result.error) {
        errors.push(`${src.name}: ${result.error}`)
      }
      for (const item of result.items) all.push(item)
    }),
  )

  const deduped = dedupByUrl(all)

  // Tag everything in one pass and shape into the DB row.
  const rows = deduped.map((item) => {
    const text = `${item.title} ${item.summary ?? ''}`
    const tags = tagAll(text)
    return {
      source: item.source,
      source_url: item.sourceUrl,
      external_guid: item.externalGuid,
      title: item.title,
      summary: item.summary,
      countries: tags.countries,
      levels: tags.levels,
      funding: tags.funding,
      deadline_at: tags.deadline,
      published_at: item.publishedAt,
      fetched_at: new Date().toISOString(),
    }
  })

  let upserted = 0
  if (rows.length > 0) {
    let supabase
    try {
      supabase = createServiceRoleClient()
    } catch (err) {
      return {
        ok: false,
        error:
          err instanceof Error ? err.message : 'service-role init failed',
      }
    }

    // Chunk to keep individual upsert payloads small  Supabase rejects
    // very large requests with cryptic errors, and we'd rather see one
    // chunk fail than the whole batch.
    const CHUNK = 200
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK)
      const { error } = await supabase
        .from('scholarship_news')
        .upsert(chunk, { onConflict: 'source_url' })
      if (error) {
        errors.push(`upsert chunk ${i / CHUNK}: ${error.message}`)
        continue
      }
      upserted += chunk.length
    }
  }

  return {
    ok: true,
    durationMs: Date.now() - start,
    fetched: all.length,
    upserted,
    perSource,
    errors,
  }
}
