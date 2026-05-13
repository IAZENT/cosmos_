export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' | 'NONE'

/**
 * Normalise free-form severity strings (NVD can return upper or title case,
 * or omit it entirely) to the canonical Severity union.
 */
export function normalizeSeverity(raw: string | null | undefined): Severity {
  if (!raw) return 'NONE'
  const upper = raw.toUpperCase()
  switch (upper) {
    case 'CRITICAL':
    case 'HIGH':
    case 'MEDIUM':
    case 'LOW':
    case 'INFO':
      return upper
    default:
      return 'NONE'
  }
}

/**
 * Classify a CVSS base score per NVD guidance:
 *   9.0–10.0  CRITICAL
 *   7.0–8.9   HIGH
 *   4.0–6.9   MEDIUM
 *   0.1–3.9   LOW
 *   0.0       NONE
 */
export function severityFromScore(
  score: number | null | undefined,
): Severity {
  if (score == null || Number.isNaN(score)) return 'NONE'
  if (score >= 9.0) return 'CRITICAL'
  if (score >= 7.0) return 'HIGH'
  if (score >= 4.0) return 'MEDIUM'
  if (score > 0.0) return 'LOW'
  return 'NONE'
}

export const severityVarMap: Record<Severity, string> = {
  CRITICAL: 'var(--cosmos-critical)',
  HIGH: 'var(--cosmos-high)',
  MEDIUM: 'var(--cosmos-medium)',
  LOW: 'var(--cosmos-low)',
  INFO: 'var(--cosmos-info)',
  NONE: 'var(--cosmos-text-dim)',
}
