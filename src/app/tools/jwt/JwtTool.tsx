'use client'

import { AlertCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CopyButton } from '@/components/tools/CopyButton'

function base64UrlDecode(seg: string): string {
  let s = seg.replace(/-/g, '+').replace(/_/g, '/')
  const pad = s.length % 4
  if (pad === 2) s += '=='
  else if (pad === 3) s += '='
  else if (pad === 1) throw new Error('Invalid base64url segment length.')
  const binary = atob(s)
   
  return decodeURIComponent(escape(binary))
}

interface DecodedJwt {
  header: unknown
  payload: unknown
  signature: string
  headerRaw: string
  payloadRaw: string
}

function decodeJwt(token: string): DecodedJwt {
  const parts = token.trim().split('.')
  if (parts.length !== 3) {
    throw new Error(
      `Expected three dot-separated segments, got ${parts.length}.`,
    )
  }
  const [h, p, s] = parts as [string, string, string]
  const headerJson = base64UrlDecode(h)
  const payloadJson = base64UrlDecode(p)
  let header: unknown
  let payload: unknown
  try {
    header = JSON.parse(headerJson)
  } catch {
    throw new Error('Header segment is not valid JSON.')
  }
  try {
    payload = JSON.parse(payloadJson)
  } catch {
    throw new Error('Payload segment is not valid JSON.')
  }
  return {
    header,
    payload,
    signature: s,
    headerRaw: headerJson,
    payloadRaw: payloadJson,
  }
}

function formatTimestamp(v: unknown): string | null {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null
  const ms = v > 1e12 ? v : v * 1000 // accept seconds or ms
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return null
  const iso = d.toISOString().replace('.000Z', 'Z')
  const nowSec = Date.now() / 1000
  const deltaSec = v - (v > 1e12 ? Date.now() : nowSec)
  const abs = Math.abs(deltaSec)
  const unit =
    abs < 60
      ? `${Math.round(abs)}s`
      : abs < 3600
        ? `${Math.round(abs / 60)}m`
        : abs < 86_400
          ? `${Math.round(abs / 3600)}h`
          : `${Math.round(abs / 86_400)}d`
  const rel = deltaSec >= 0 ? `in ${unit}` : `${unit} ago`
  return `${iso} · ${rel}`
}

function Pretty({ value }: { value: unknown }) {
  const json = JSON.stringify(value, null, 2) ?? ''
  return (
    <pre className="overflow-x-auto rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] p-3 font-mono text-[12px] leading-relaxed text-[var(--cosmos-text)]">
      {json}
    </pre>
  )
}

export function JwtTool() {
  const [token, setToken] = useState('')

  const decoded = useMemo(() => {
    if (!token.trim()) return { data: null, error: null as string | null }
    try {
      return { data: decodeJwt(token), error: null }
    } catch (err) {
      return {
        data: null,
        error:
          err instanceof Error ? err.message : 'Unable to decode token.',
      }
    }
  }, [token])

  const claims =
    decoded.data && typeof decoded.data.payload === 'object' && decoded.data.payload !== null
      ? (decoded.data.payload as Record<string, unknown>)
      : null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
            JWT
          </span>
          <CopyButton value={token} label="Copy" />
        </div>
        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          rows={6}
          placeholder="eyJhbGciOi…"
          className="rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] p-3 font-mono text-[12px] leading-relaxed text-[var(--cosmos-text)] break-all"
          spellCheck={false}
        />
        {decoded.error ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-[4px] border border-[var(--cosmos-critical)]/40 bg-[var(--cosmos-critical)]/10 px-3 py-2 font-mono text-[11px] text-[var(--cosmos-critical)]"
          >
            <AlertCircle size={12} aria-hidden className="mt-0.5" />
            {decoded.error}
          </p>
        ) : null}
      </div>

      {decoded.data ? (
        <>
          <Panel
            label="header"
            copyValue={decoded.data.headerRaw}
          >
            <Pretty value={decoded.data.header} />
          </Panel>

          <Panel
            label="payload"
            copyValue={decoded.data.payloadRaw}
          >
            <Pretty value={decoded.data.payload} />
            {claims ? <ClaimTable claims={claims} /> : null}
          </Panel>

          <Panel label="signature" copyValue={decoded.data.signature}>
            <pre className="break-all rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] p-3 font-mono text-[12px] leading-relaxed text-[var(--cosmos-text-muted)]">
              {decoded.data.signature || '(empty)'}
            </pre>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
              {'// base64url-encoded. verification requires the issuer key.'}
            </p>
          </Panel>
        </>
      ) : null}
    </div>
  )
}

function Panel({
  label,
  copyValue,
  children,
}: {
  label: string
  copyValue: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--cosmos-code)]">
          {`// ${label}`}
        </p>
        <CopyButton value={copyValue} label="Copy raw" />
      </div>
      {children}
    </section>
  )
}

const TIMESTAMP_CLAIMS = new Set(['exp', 'iat', 'nbf', 'auth_time', 'updated_at'])

function ClaimTable({ claims }: { claims: Record<string, unknown> }) {
  const timestamps = Object.entries(claims).filter(
    ([k, v]) =>
      TIMESTAMP_CLAIMS.has(k) && typeof v === 'number' && Number.isFinite(v),
  ) as [string, number][]
  if (timestamps.length === 0) return null
  return (
    <div className="mt-4 overflow-hidden rounded-[4px] border border-[var(--cosmos-border)]">
      <table className="w-full text-left font-mono text-[11px]">
        <thead className="bg-[var(--cosmos-bg-subtle)] text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
          <tr>
            <th className="px-3 py-2 font-normal">Claim</th>
            <th className="px-3 py-2 font-normal">Unix</th>
            <th className="px-3 py-2 font-normal">Resolved</th>
          </tr>
        </thead>
        <tbody>
          {timestamps.map(([k, v]) => (
            <tr key={k} className="border-t border-[var(--cosmos-border-dim)]">
              <td className="px-3 py-1.5 text-[var(--cosmos-text)]">{k}</td>
              <td className="px-3 py-1.5 text-[var(--cosmos-text-muted)]">{v}</td>
              <td className="px-3 py-1.5 text-[var(--cosmos-text-dim)]">
                {formatTimestamp(v) ?? ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
