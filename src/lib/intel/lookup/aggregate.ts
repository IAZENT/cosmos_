// Top-level aggregator. Detects the input kind, fans out to every
// relevant source in parallel, then computes an overall verdict.

import { detectKind } from './detect'
import type { LookupResponse, SourceReport, Verdict } from './types'
import { abuseIpdbCheck } from './sources/abuseipdb'
import { hostIoFull } from './sources/hostio'
import { hunterDomain, hunterVerify } from './sources/hunter'
import { shodanHost, shodanResolveDomain } from './sources/shodan'
import { urlscanSearchDomain, urlscanSearchUrl } from './sources/urlscan'
import { vtDomain, vtHash, vtIp, vtUrl } from './sources/virustotal'

const VERDICT_RANK: Record<Verdict, number> = {
  unknown: 0,
  clean: 1,
  suspicious: 2,
  malicious: 3,
}

function computeOverall(sources: SourceReport[]): LookupResponse['overall'] {
  let worst: Verdict = 'unknown'
  let maxScore = 0
  const reasons: string[] = []
  for (const s of sources) {
    if (s.status !== 'ok' || !s.verdict) continue
    if (VERDICT_RANK[s.verdict] > VERDICT_RANK[worst]) worst = s.verdict
    if (typeof s.score === 'number' && s.score > maxScore) maxScore = s.score
    if (s.verdict === 'malicious' || s.verdict === 'suspicious') {
      if (s.summary) reasons.push(`${s.label}: ${s.summary}`)
    }
  }
  return { verdict: worst, score: Math.round(maxScore), reasons }
}

export async function runLookup(raw: string): Promise<LookupResponse> {
  const { kind, normalized } = detectKind(raw)
  const fetched_at = new Date().toISOString()
  let sources: SourceReport[] = []

  switch (kind) {
    case 'ip':
      sources = await Promise.all([
        vtIp(normalized),
        abuseIpdbCheck(normalized),
        shodanHost(normalized),
      ])
      break
    case 'domain':
      sources = await Promise.all([
        vtDomain(normalized),
        hostIoFull(normalized),
        shodanResolveDomain(normalized),
        hunterDomain(normalized),
        urlscanSearchDomain(normalized),
      ])
      break
    case 'url':
      sources = await Promise.all([
        vtUrl(normalized),
        urlscanSearchUrl(normalized),
      ])
      break
    case 'hash':
      sources = await Promise.all([vtHash(normalized)])
      break
    case 'email':
      sources = await Promise.all([hunterVerify(normalized)])
      break
    case 'unknown':
    default:
      sources = []
  }

  return {
    query: raw,
    kind,
    normalized,
    fetched_at,
    sources,
    overall: computeOverall(sources),
  }
}
