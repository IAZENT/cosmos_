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
