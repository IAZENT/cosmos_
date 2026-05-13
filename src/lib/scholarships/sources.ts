/**
 * Source registry for the scholarship news aggregator.
 *
 * Each entry is either:
 *   - kind: 'rss'   classic RSS 2.0 feed; we parse it directly with parseRss().
 *   - kind: 'euraxess'  EU Researchers in motion JSON search endpoint.
 *
 * Adding a source is a 1-line change. Removing a source removes its rows
 * on the next sync (we don't tombstone-archive  RSS items don't have
 * stable cross-source identity).
 */

export type SourceDef =
  | { kind: 'rss'; name: string; url: string; weight?: number }
  | { kind: 'euraxess'; name: string; weight?: number }

export const SCHOLARSHIP_SOURCES: SourceDef[] = [
  // High-quality general aggregator. Editor-curated, fast, relatively
  // few duplicates. Best single source.
  { kind: 'rss', name: 'OpportunityDesk', url: 'https://opportunitydesk.org/feed/' },

  // Older but still active aggregator. Good breadth across funding
  // levels (BSc through Postdoc).
  { kind: 'rss', name: 'Scholars4Dev', url: 'https://www.scholars4dev.com/feed/' },

  // Same family of WordPress aggregators  helps catch postings that
  // OpportunityDesk skipped. Some duplication, handled by URL dedup.
  { kind: 'rss', name: 'ScholarshipRegion', url: 'https://www.scholarshipregion.com/feed/' },
  { kind: 'rss', name: 'ScholarshipRoar', url: 'https://scholarshiproar.com/feed/' },

  // Germany-focused: matches the user's primary use case (DAAD-flavoured
  // postings, German universities, Studienkolleg, etc.). Cloudflare-
  // fronted  requires a browser-like User-Agent (handled in parse.ts).
  { kind: 'rss', name: 'StudyingInGermany', url: 'https://www.studying-in-germany.org/feed/' },

  // Broad youth-opportunity aggregator. Mostly fellowships, conference
  // grants, and undergraduate-level scholarships. Lower overlap with
  // OpportunityDesk than expected.
  { kind: 'rss', name: 'OpportunitiesForYouth', url: 'https://opportunitiesforyouth.org/feed/' },

  // Africa-focused, but the vast majority of postings are *global*
  // scholarships open to international students  the editorial focus
  // is "what's available to African students", which usually means
  // EU / Germany / UK / North America funded programmes. Strong
  // overlap with the user's primary audience.
  { kind: 'rss', name: 'OpportunitiesForAfricans', url: 'https://opportunitiesforafricans.com/feed/' },

  // Heavy on Postdoc + research-position postings (Sydney, MPI, ETH,
  // etc.). Adds the PhD/postdoc layer that the other aggregators
  // under-cover. Note: includes some pure-academic-job posts; our
  // level tagger usually flags these correctly as Postdoc.
  { kind: 'rss', name: 'ScholarIdea', url: 'https://www.scholaridea.com/feed/' },

  // EURAXESS  the official EU researcher portal  is intentionally
  // omitted right now: their public API surface changed in late 2025
  // and the previous undocumented JSON endpoint we relied on returns
  // 404. The adapter in parse.ts (`fetchEuraxess`) is kept around so
  // we can re-enable this source as soon as a stable feed URL is
  // confirmed. Re-add with: { kind: 'euraxess', name: 'EURAXESS' }
]
