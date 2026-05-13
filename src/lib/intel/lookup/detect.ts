import type { LookupKind } from './types'

const IPV4 =
  /^(25[0-5]|2[0-4]\d|[01]?\d{1,2})(\.(25[0-5]|2[0-4]\d|[01]?\d{1,2})){3}$/
const IPV6 =
  /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/
const DOMAIN =
  /^(?=.{1,253}$)(?!-)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const HASH_HEX = /^[a-f0-9]+$/i

export function detectKind(raw: string): {
  kind: LookupKind
  normalized: string
} {
  const trimmed = raw.trim()
  if (!trimmed) return { kind: 'unknown', normalized: '' }

  // URL  must come before plain domain because URLs contain dots too.
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed)
      return { kind: 'url', normalized: u.toString() }
    } catch {
      return { kind: 'unknown', normalized: trimmed }
    }
  }

  if (IPV4.test(trimmed) || IPV6.test(trimmed)) {
    return { kind: 'ip', normalized: trimmed }
  }

  if (EMAIL.test(trimmed)) {
    return { kind: 'email', normalized: trimmed.toLowerCase() }
  }

  if (HASH_HEX.test(trimmed)) {
    const len = trimmed.length
    if (len === 32 || len === 40 || len === 64) {
      return { kind: 'hash', normalized: trimmed.toLowerCase() }
    }
  }

  // Fallback: treat as domain if it looks like one. Strip any leading
  // protocol-less `www.` for canonicalisation.
  const domainCandidate = trimmed.replace(/^www\./i, '').toLowerCase()
  if (DOMAIN.test(domainCandidate)) {
    return { kind: 'domain', normalized: domainCandidate }
  }

  return { kind: 'unknown', normalized: trimmed }
}
