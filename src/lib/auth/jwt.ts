// JWT decoding for the admin session inspector.
//
// We decode locally  no signature verification. Supabase Auth issued
// the JWT into our cookie, so trust is established by `getUser()`
// upstream; this helper only renders the claims for human inspection.
//
// JWT base64url decoder that works in both Node and Edge runtimes:
// `atob` is the only primitive guaranteed available in both.

export type JwtHeader = {
  alg?: string
  typ?: string
  kid?: string
}

export type JwtPayload = {
  iss?: string // issuer (https://<project>.supabase.co/auth/v1)
  sub?: string // user UUID
  aud?: string // typically "authenticated"
  exp?: number // unix seconds
  iat?: number // unix seconds
  email?: string
  phone?: string
  role?: string // anon / authenticated / service_role
  session_id?: string
  is_anonymous?: boolean
  app_metadata?: Record<string, unknown>
  user_metadata?: Record<string, unknown>
  amr?: Array<{ method: string; timestamp: number }>
  aal?: string // 'aal1' | 'aal2' (auth assurance level)
  [k: string]: unknown
}

export type DecodedJwt = {
  header: JwtHeader
  payload: JwtPayload
  signature: string // raw base64url segment
}

function base64UrlDecode(seg: string): string {
  // Pad and convert from URL-safe alphabet.
  const padded = seg.replace(/-/g, '+').replace(/_/g, '/')
  const padding = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  const decoded = atob(padded + padding)
  // Convert binary string to UTF-8 string (handles non-ASCII claims).
  try {
    const bytes = new Uint8Array(decoded.length)
    for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i)
    return new TextDecoder().decode(bytes)
  } catch {
    return decoded
  }
}

export function decodeJwt(token: string): DecodedJwt | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const header = JSON.parse(base64UrlDecode(parts[0] ?? '')) as JwtHeader
    const payload = JSON.parse(base64UrlDecode(parts[1] ?? '')) as JwtPayload
    return { header, payload, signature: parts[2] ?? '' }
  } catch {
    return null
  }
}

/** Seconds remaining until JWT expiry. Negative if already expired. */
export function secondsUntilExpiry(payload: JwtPayload): number | null {
  if (typeof payload.exp !== 'number') return null
  return payload.exp - Math.floor(Date.now() / 1000)
}

/** Format unix seconds into ISO-friendly UTC string. */
export function unixToIso(secs: number | null | undefined): string | null {
  if (typeof secs !== 'number') return null
  return new Date(secs * 1000).toISOString()
}
