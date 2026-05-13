import { formatDistanceToNowStrict, parseISO, isValid } from 'date-fns'

/**
 * Parse an NVD/ISO string into a Date, or return null on failure.
 */
export function parseNVDDate(raw: string | null | undefined): Date | null {
  if (!raw) return null
  const d = parseISO(raw)
  return isValid(d) ? d : null
}

/**
 * Human-readable relative time ("2 hours ago"). Returns "" when the input
 * cannot be parsed.
 */
export function formatRelative(raw: string | null | undefined): string {
  const d = parseNVDDate(raw)
  if (!d) return ''
  try {
    return `${formatDistanceToNowStrict(d)} ago`
  } catch {
    return ''
  }
}

/**
 * Format for display in "sync status" lines. Example: `2026-05-13 22:40 UTC`.
 */
export function formatUTC(raw: string | null | undefined): string {
  const d = parseNVDDate(raw)
  if (!d) return ''
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mm = String(d.getUTCMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${hh}:${mm} UTC`
}
