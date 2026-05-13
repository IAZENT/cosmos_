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
  // postings, German universities, Studienkolleg, etc.).
  { kind: 'rss', name: 'StudyingInGermany', url: 'https://www.studying-in-germany.org/feed/' },

  // Official EU researcher portal. PhD positions, postdoc fellowships,
  // Marie Sklodowska-Curie grants. Adapter handles the JSON format.
  { kind: 'euraxess', name: 'EURAXESS' },
]
