import type { Severity } from '@/lib/utils/severity'

export type SavedSearchSeverity = 'ALL' | Severity

export interface SavedSearchFilters {
  severity: SavedSearchSeverity
  kevOnly: boolean
  search: string
  from: string // ISO date (YYYY-MM-DD) or empty
  to: string
}

export const EMPTY_FILTERS: SavedSearchFilters = {
  severity: 'ALL',
  kevOnly: false,
  search: '',
  from: '',
  to: '',
}

export interface SavedSearchRow {
  id: string
  email: string
  label: string | null
  filters: SavedSearchFilters
  verified: boolean
  verification_token: string
  unsubscribe_token: string
  last_sent_at: string | null
  verified_at: string | null
  created_at: string
}

/**
 * Render a saved search's filter object as a human-readable summary line.
 * Used in verification + digest emails and in the UI confirmation modal.
 */
export function describeFilters(f: SavedSearchFilters): string {
  const parts: string[] = []
  parts.push(f.severity === 'ALL' ? 'any severity' : f.severity.toLowerCase())
  if (f.kevOnly) parts.push('KEV only')
  if (f.search.trim()) parts.push(`matching "${f.search.trim()}"`)
  if (f.from) parts.push(`from ${f.from}`)
  if (f.to) parts.push(`to ${f.to}`)
  return parts.join(' · ')
}
