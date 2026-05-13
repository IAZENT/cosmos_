export type IntelStatKey =
  | 'total_cves_tracked'
  | 'critical_cves_24h'
  | 'kev_total'

export type IntelStats = Record<IntelStatKey, number>

export const EMPTY_STATS: IntelStats = {
  total_cves_tracked: 0,
  critical_cves_24h: 0,
  kev_total: 0,
}

/** Combined payload returned by `/api/intelligence/stats`. */
export interface IntelStatsPayload extends IntelStats {
  last_synced_at: string | null
}

export interface SyncResult {
  synced: number
  errors: string[]
  durationMs: number
}
