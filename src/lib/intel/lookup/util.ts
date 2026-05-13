// Shared helpers for source connectors.

const DEFAULT_TIMEOUT_MS = 6000

export async function fetchWithTimeout(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...rest } = init
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    return await fetch(url, { ...rest, signal: ctrl.signal })
  } finally {
    clearTimeout(timer)
  }
}

/** Used everywhere to keep numbers sane for UI rendering. */
export function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n))
}
