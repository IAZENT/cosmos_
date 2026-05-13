import type {
  FundingType,
  ScholarshipCountry,
  ScholarshipLevel,
} from '@/types/scholarship'

/**
 * A curated, hand-maintained record of a major scholarship and its
 * typical annual application cycle. Keeping this as a TS constant (not
 * a DB table) for v1 because:
 *   1. Cycle dates barely change year-to-year  one PR per year keeps
 *      it fresh, no admin UI required.
 *   2. ~30-50 entries is the natural size; a DB query is overkill.
 *   3. Values are reviewed in code review, which catches bad-date typos
 *      better than a free-form admin form would.
 *
 * Migration path to a DB table is straightforward when we outgrow this:
 * the row shape mirrors a `scholarship_cycles` table 1:1.
 */
export interface ScholarshipCycle {
  /** URL-safe identifier. Used for permalinks (`/scholarships/cycle/[slug]`). */
  slug: string
  /** Human-readable, e.g. "DAAD Study Scholarship". */
  name: string
  /** Primary country/region the scholarship is hosted by. */
  country: ScholarshipCountry
  /** Degree levels the scholarship targets. */
  levels: ScholarshipLevel[]
  /** Funding tier, mirroring the news-feed taxonomy. */
  funding: FundingType
  /**
   * Typical month/day the application window opens (1-indexed month,
   * 1-31 day). We compute the next-open-date relative to today() at
   * render time.
   */
  typicalOpen: { month: number; day: number }
  /** Typical close date, same format. */
  typicalClose: { month: number; day: number }
  /** Canonical official page  the only URL we trust for actual dates. */
  officialUrl: string
  /** One- or two-sentence summary suitable for a card. */
  description: string
  /** Monetary value summary. Free-text; consistency matters more than format. */
  value?: string
  /** Caveats: 'cycle varies by country office', 'biannual', etc. */
  notes?: string
  /**
   * Year the cycle dates above were last sanity-checked against the
   * official source. Lets the UI show a 'last verified: 2025' badge
   * and helps remind us when an entry needs review.
   */
  verifiedYear: number
}

export type CycleStatus =
  | { kind: 'open_now'; closesAt: Date; daysUntilClose: number }
  | { kind: 'opening_soon'; opensAt: Date; daysUntilOpen: number }
  | { kind: 'later'; opensAt: Date; daysUntilOpen: number }

export interface CycleWithStatus {
  cycle: ScholarshipCycle
  status: CycleStatus
}
