'use client'

import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  ShieldAlert,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// Inline live-scan flow: POST the URL to urlscan.io via our proxy,
// then poll until the verdict is ready. Same backend as the standalone
// tool (which we removed) — just embedded directly into the URL card
// of the unified lookup result.

type LiveResult = {
  status: 'pending' | 'done'
  submittedUrl: string | null
  finalUrl: string | null
  domain: string | null
  ip: string | null
  country: string | null
  reportUrl: string
  screenshotUrl: string
  malicious: boolean
  score: number | null
  categories: string[]
}

type Phase = 'idle' | 'submitting' | 'polling' | 'done' | 'error'

const POLL_INTERVAL_MS = 4000
const MAX_POLL_ATTEMPTS = 20

export function UrlscanLiveScan({ url }: { url: string }) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [result, setResult] = useState<LiveResult | null>(null)
  const pollRef = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)

  const clearTimers = () => {
    if (pollRef.current != null) window.clearTimeout(pollRef.current)
    if (timerRef.current != null) window.clearInterval(timerRef.current)
    pollRef.current = null
    timerRef.current = null
  }
  useEffect(() => () => clearTimers(), [])

  const start = async () => {
    setError(null)
    setResult(null)
    setElapsed(0)
    setPhase('submitting')
    try {
      const res = await fetch('/api/tools/urlscan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, visibility: 'public' }),
      })
      const data = (await res.json()) as { uuid?: string; error?: string }
      if (!res.ok || !data.uuid) {
        setError(data.error ?? `Submit failed (${res.status}).`)
        setPhase('error')
        return
      }
      setPhase('polling')
      timerRef.current = window.setInterval(
        () => setElapsed((s) => s + 1),
        1000,
      )
      poll(data.uuid, 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error.')
      setPhase('error')
    }
  }

  const poll = async (uuid: string, attempt: number) => {
    if (attempt >= MAX_POLL_ATTEMPTS) {
      clearTimers()
      setError(
        'Scan is taking longer than expected. Check the report on urlscan.io.',
      )
      setPhase('error')
      return
    }
    try {
      const res = await fetch(
        `/api/tools/urlscan?uuid=${encodeURIComponent(uuid)}`,
      )
      const data = (await res.json()) as Partial<LiveResult> & { error?: string }
      if (!res.ok) {
        clearTimers()
        setError(data.error ?? `Poll failed (${res.status}).`)
        setPhase('error')
        return
      }
      if (data.status === 'done') {
        clearTimers()
        setResult(data as LiveResult)
        setPhase('done')
        return
      }
      pollRef.current = window.setTimeout(
        () => poll(uuid, attempt + 1),
        POLL_INTERVAL_MS,
      )
    } catch (err) {
      clearTimers()
      setError(err instanceof Error ? err.message : 'Poll error.')
      setPhase('error')
    }
  }

  if (phase === 'idle') {
    return (
      <button
        type="button"
        onClick={start}
        className="cosmos-btn-ghost self-start"
      >
        <ShieldAlert size={11} aria-hidden /> Submit a fresh scan + screenshot
      </button>
    )
  }

  if (phase === 'submitting' || phase === 'polling') {
    return (
      <div className="flex items-center gap-2 rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] px-3 py-2 font-mono text-[11px] text-[var(--cosmos-text-muted)]">
        <Loader2 size={11} className="animate-spin" aria-hidden />
        {phase === 'submitting'
          ? 'Submitting to urlscan.io…'
          : `Awaiting verdict (${elapsed}s)`}
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div
        role="alert"
        className="flex items-start gap-2 rounded-[4px] border border-[var(--cosmos-critical)]/40 bg-[var(--cosmos-critical)]/10 px-3 py-2 font-mono text-[11px] text-[var(--cosmos-critical)]"
      >
        <AlertTriangle size={11} aria-hidden className="mt-0.5" />
        {error}
      </div>
    )
  }

  // phase === 'done'
  if (!result) return null
  return (
    <div className="flex flex-col gap-3 rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] p-3">
      <div className="flex items-center gap-2">
        {result.malicious ? (
          <AlertTriangle
            size={12}
            aria-hidden
            className="text-[var(--cosmos-critical)]"
          />
        ) : (
          <CheckCircle2
            size={12}
            aria-hidden
            className="text-[var(--cosmos-low)]"
          />
        )}
        <span
          className={cn(
            'font-mono text-[11px] uppercase tracking-[0.1em]',
            result.malicious
              ? 'text-[var(--cosmos-critical)]'
              : 'text-[var(--cosmos-low)]',
          )}
        >
          Fresh scan · {result.malicious ? 'malicious verdict' : 'no malicious verdict'}
        </span>
        {typeof result.score === 'number' ? (
          <span className="ml-auto font-mono text-[10px] text-[var(--cosmos-text-dim)]">
            score {result.score}
          </span>
        ) : null}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={result.screenshotUrl}
        alt={`Screenshot of ${result.domain ?? 'target'}`}
        loading="lazy"
        className="w-full rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg)]"
      />
      <div className="flex flex-wrap gap-3 font-mono text-[11px] text-[var(--cosmos-text-muted)]">
        {result.ip ? <span>IP: {result.ip}</span> : null}
        {result.country ? <span>Country: {result.country}</span> : null}
      </div>
      <a
        href={result.reportUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[var(--cosmos-accent)] hover:underline"
      >
        <ExternalLink size={11} aria-hidden /> Open the full live report
      </a>
    </div>
  )
}
