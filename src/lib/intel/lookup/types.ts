// Shared types for the unified threat-lookup tool.
//
// Every upstream source (VirusTotal, AbuseIPDB, Shodan, host.io,
// Hunter) returns a `SourceReport` so the UI can render them with one
// component regardless of provider.

export type LookupKind = 'ip' | 'domain' | 'url' | 'hash' | 'email' | 'unknown'

export type Verdict = 'clean' | 'suspicious' | 'malicious' | 'unknown'

export type ReportField = {
  label: string
  value: string | number | null
  /** Optional outbound link (e.g. for IPs, vendors, ASN pages). */
  href?: string
  /** Render as a code/font-mono span. */
  mono?: boolean
}

export type SourceReport = {
  source:
    | 'virustotal'
    | 'abuseipdb'
    | 'shodan'
    | 'hostio'
    | 'hunter'
    | 'urlscan'
  label: string
  status: 'ok' | 'no_data' | 'error' | 'skipped' | 'unconfigured'
  /** Human-readable summary (one line). */
  summary?: string
  verdict?: Verdict
  /** 0–100 normalized risk score where higher = more dangerous. */
  score?: number | null
  fields?: ReportField[]
  /** Outbound link to the provider's full report. */
  reportUrl?: string
  /** Wall-clock millis spent on this fetch (debug). */
  durationMs?: number
  /** Reason when status is `error` / `skipped`. */
  message?: string
}

export type LookupResponse = {
  query: string
  kind: LookupKind
  /** Canonicalised version of the query (lowercased domain, trimmed hash). */
  normalized: string
  fetched_at: string
  sources: SourceReport[]
  /** Computed at the end based on every report's verdict + score. */
  overall: {
    verdict: Verdict
    score: number
    reasons: string[]
  }
}
