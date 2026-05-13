/**
 * CVSS v3.1 base score calculator.
 * Reference: https://www.first.org/cvss/v3.1/specification-document (section 7.1).
 */

export type AV = 'N' | 'A' | 'L' | 'P'
export type AC = 'L' | 'H'
export type PR = 'N' | 'L' | 'H'
export type UI = 'N' | 'R'
export type S = 'U' | 'C'
export type CIA = 'H' | 'L' | 'N'

export interface CvssVector {
  AV: AV
  AC: AC
  PR: PR
  UI: UI
  S: S
  C: CIA
  I: CIA
  A: CIA
}

export const DEFAULT_VECTOR: CvssVector = {
  AV: 'N',
  AC: 'L',
  PR: 'N',
  UI: 'N',
  S: 'U',
  C: 'N',
  I: 'N',
  A: 'N',
}

const AV_VALUES: Record<AV, number> = { N: 0.85, A: 0.62, L: 0.55, P: 0.2 }
const AC_VALUES: Record<AC, number> = { L: 0.77, H: 0.44 }
const PR_VALUES_UNCHANGED: Record<PR, number> = { N: 0.85, L: 0.62, H: 0.27 }
const PR_VALUES_CHANGED: Record<PR, number> = { N: 0.85, L: 0.68, H: 0.5 }
const UI_VALUES: Record<UI, number> = { N: 0.85, R: 0.62 }
const CIA_VALUES: Record<CIA, number> = { H: 0.56, L: 0.22, N: 0 }

function roundUp1(v: number): number {
  // CVSS v3.1 specification: "Round Up" (round up to next 0.1 increment).
  return Math.ceil(v * 10) / 10
}

export interface CvssResult {
  baseScore: number
  severity: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  impactSubScore: number
  exploitabilitySubScore: number
  vector: string
}

export function calculateCvss(v: CvssVector): CvssResult {
  const avV = AV_VALUES[v.AV]
  const acV = AC_VALUES[v.AC]
  const prV = v.S === 'C' ? PR_VALUES_CHANGED[v.PR] : PR_VALUES_UNCHANGED[v.PR]
  const uiV = UI_VALUES[v.UI]
  const cV = CIA_VALUES[v.C]
  const iV = CIA_VALUES[v.I]
  const aV = CIA_VALUES[v.A]

  const iscBase = 1 - (1 - cV) * (1 - iV) * (1 - aV)
  const impactSub =
    v.S === 'U'
      ? 6.42 * iscBase
      : 7.52 * (iscBase - 0.029) - 3.25 * Math.pow(iscBase - 0.02, 15)
  const exploitabilitySub = 8.22 * avV * acV * prV * uiV

  let baseScore: number
  if (impactSub <= 0) {
    baseScore = 0
  } else {
    const raw =
      v.S === 'U'
        ? Math.min(impactSub + exploitabilitySub, 10)
        : Math.min(1.08 * (impactSub + exploitabilitySub), 10)
    baseScore = roundUp1(raw)
  }

  const severity =
    baseScore === 0
      ? 'NONE'
      : baseScore < 4
        ? 'LOW'
        : baseScore < 7
          ? 'MEDIUM'
          : baseScore < 9
            ? 'HIGH'
            : 'CRITICAL'

  const vector = `CVSS:3.1/AV:${v.AV}/AC:${v.AC}/PR:${v.PR}/UI:${v.UI}/S:${v.S}/C:${v.C}/I:${v.I}/A:${v.A}`
  return {
    baseScore,
    severity,
    impactSubScore: Math.round(impactSub * 10) / 10,
    exploitabilitySubScore: Math.round(exploitabilitySub * 10) / 10,
    vector,
  }
}

export function parseCvssVector(raw: string): CvssVector | null {
  if (!raw) return null
  const parts = raw.trim().split('/')
  if (parts.length === 0) return null
  if (!parts[0]?.startsWith('CVSS:3.1')) return null
  const map: Partial<Record<keyof CvssVector, string>> = {}
  for (const p of parts.slice(1)) {
    const [k, v] = p.split(':')
    if (!k || !v) continue
    if (
      k === 'AV' ||
      k === 'AC' ||
      k === 'PR' ||
      k === 'UI' ||
      k === 'S' ||
      k === 'C' ||
      k === 'I' ||
      k === 'A'
    ) {
      map[k] = v
    }
  }
  const candidate: CvssVector = { ...DEFAULT_VECTOR }
  if (map.AV && 'NALP'.includes(map.AV)) candidate.AV = map.AV as AV
  else return null
  if (map.AC && 'LH'.includes(map.AC)) candidate.AC = map.AC as AC
  else return null
  if (map.PR && 'NLH'.includes(map.PR)) candidate.PR = map.PR as PR
  else return null
  if (map.UI && 'NR'.includes(map.UI)) candidate.UI = map.UI as UI
  else return null
  if (map.S && 'UC'.includes(map.S)) candidate.S = map.S as S
  else return null
  if (map.C && 'HLN'.includes(map.C)) candidate.C = map.C as CIA
  else return null
  if (map.I && 'HLN'.includes(map.I)) candidate.I = map.I as CIA
  else return null
  if (map.A && 'HLN'.includes(map.A)) candidate.A = map.A as CIA
  else return null
  return candidate
}
