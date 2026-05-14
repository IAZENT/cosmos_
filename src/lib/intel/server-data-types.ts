import type { Severity } from '@/lib/utils/severity'

export interface PreviewCVE {
  id: string
  cveId: string
  description: string | null
  cvssScore: number | null
  severity: Severity | null
  publishedAt: string | null
  isKev: boolean
}

export interface TickerCVE {
  cveId: string
  severity: Severity | null
  cvssScore: number | null
}

export interface KevHighlight {
  id: string
  cveId: string
  kevAddedAt: string | null
  description: string | null
  kevAction: string | null
}

export interface SeverityBreakdown {
  critical: number
  high: number
  medium: number
  low: number
}

export interface ThreatVelocity {
  /** CVEs published in the last hour. */
  ratePerHour: number
  /** Hourly publish rate averaged over the last 7 days. */
  baseline7dPerHour: number
  /** Percent delta of `ratePerHour` vs `baseline7dPerHour`. 0 if no baseline. */
  deltaPct: number
  /** True when ratePerHour is meaningfully above the trailing 7-day average. */
  elevated: boolean
  /** ISO timestamp when this snapshot was computed. */
  computedAt: string
}

export const EMPTY_VELOCITY: ThreatVelocity = {
  ratePerHour: 0,
  baseline7dPerHour: 0,
  deltaPct: 0,
  elevated: false,
  computedAt: new Date(0).toISOString(),
}
