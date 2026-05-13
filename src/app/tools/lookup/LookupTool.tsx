'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { CopyButton } from '@/components/tools/CopyButton'
import { detectKind } from '@/lib/intel/lookup/detect'
import type {
  LookupKind,
  LookupResponse,
  ReportField,
  SourceReport,
  Verdict,
} from '@/lib/intel/lookup/types'
import { UrlscanLiveScan } from './UrlscanLiveScan'

const VERDICT_STYLE: Record<Verdict, { fg: string; bg: string; border: string; label: string }> = {
  malicious: {
    fg: 'text-[var(--cosmos-critical)]',
    bg: 'bg-[var(--cosmos-critical)]/10',
    border: 'border-[var(--cosmos-critical)]/40',
    label: 'malicious',
  },
  suspicious: {
    fg: 'text-[var(--cosmos-medium)]',
    bg: 'bg-[var(--cosmos-medium)]/10',
    border: 'border-[var(--cosmos-medium)]/40',
    label: 'suspicious',
  },
  clean: {
    fg: 'text-[var(--cosmos-low)]',
    bg: 'bg-[var(--cosmos-low)]/10',
    border: 'border-[var(--cosmos-low)]/40',
    label: 'clean',
  },
  unknown: {
    fg: 'text-[var(--cosmos-text-muted)]',
    bg: 'bg-[var(--cosmos-bg-subtle)]',
    border: 'border-[var(--cosmos-border)]',
    label: 'unknown',
  },
}

const KIND_LABEL: Record<LookupKind, string> = {
  ip: 'IPv4 / IPv6 address',
  domain: 'Domain',
  url: 'URL',
  hash: 'File hash',
  email: 'Email address',
  unknown: 'Unrecognized input',
}

type Phase = 'idle' | 'loading' | 'done' | 'error'

const EXAMPLES: { label: string; value: string }[] = [
  { label: 'Bad IP', value: '185.220.101.1' },
  { label: 'Domain', value: 'github.com' },
  { label: 'EICAR hash', value: '275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f' },
  { label: 'URL', value: 'https://example.com' },
  { label: 'Email', value: 'security@github.com' },
]

export function LookupTool() {
  const [input, setInput] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<LookupResponse | null>(null)

  const detected = input.trim() ? detectKind(input) : { kind: 'unknown' as LookupKind, normalized: '' }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    setPhase('loading')
    setError(null)
    setData(null)
    try {
      const res = await fetch('/api/tools/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: input.trim() }),
      })
      const json = (await res.json()) as LookupResponse & { error?: string }
      if (!res.ok) {
        setError(json.error ?? `Request failed (${res.status}).`)
        setPhase('error')
        return
      }
      setData(json)
      setPhase('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error.')
      setPhase('error')
    }
  }

  const busy = phase === 'loading'

  return (
    <div className="flex flex-col gap-6">
      {/* ---- input ---- */}
      <form
        onSubmit={submit}
        className="flex flex-col gap-3 rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-4"
      >
        <label
          htmlFor="lookup-input"
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]"
        >
          Indicator
        </label>
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            id="lookup-input"
            type="text"
            autoComplete="off"
            spellCheck={false}
            required
            placeholder="8.8.8.8 · github.com · https://… · sha256… · user@domain"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={busy}
            className="flex-1 rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] px-3 py-2 font-mono text-[13px] text-[var(--cosmos-text)] focus:border-[var(--cosmos-accent)] focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={busy || !input.trim() || detected.kind === 'unknown'}
            className="inline-flex items-center justify-center gap-2 rounded-[4px] border border-[var(--cosmos-accent)] bg-[var(--cosmos-accent-dim)] px-5 py-2 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--cosmos-accent)] hover:bg-[var(--cosmos-accent)] hover:text-[var(--cosmos-bg)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? (
              <Loader2 size={14} aria-hidden className="animate-spin" />
            ) : (
              <Search size={14} aria-hidden />
            )}
            {busy ? 'Querying…' : 'Run lookup'}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--cosmos-text-dim)]">
            Detected:
          </span>
          <span
            className={cn(
              'rounded-full border px-2 py-[2px] font-mono text-[10px] uppercase tracking-[0.1em]',
              detected.kind === 'unknown'
                ? 'border-[var(--cosmos-border)] text-[var(--cosmos-text-dim)]'
                : 'border-[var(--cosmos-accent)]/40 text-[var(--cosmos-accent)]',
            )}
          >
            {KIND_LABEL[detected.kind]}
          </span>
          <span className="ml-auto flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.value}
                type="button"
                onClick={() => setInput(ex.value)}
                className="rounded-full border border-[var(--cosmos-border)] px-2 py-[2px] font-mono text-[10px] text-[var(--cosmos-text-muted)] hover:border-[var(--cosmos-accent)] hover:text-[var(--cosmos-accent)]"
              >
                {ex.label}
              </button>
            ))}
          </span>
        </div>
      </form>

      {/* ---- error ---- */}
      {error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-[6px] border border-[var(--cosmos-critical)]/40 bg-[var(--cosmos-critical)]/10 p-3 font-mono text-[12px] text-[var(--cosmos-critical)]"
        >
          <AlertTriangle size={14} aria-hidden className="mt-0.5" />
          <span>{error}</span>
        </div>
      ) : null}

      {/* ---- loading skeleton ---- */}
      {busy ? <LoadingSkeleton /> : null}

      {/* ---- results ---- */}
      {phase === 'done' && data ? <Results data={data} /> : null}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-44 animate-pulse rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)]"
        />
      ))}
    </div>
  )
}

function Results({ data }: { data: LookupResponse }) {
  const v = VERDICT_STYLE[data.overall.verdict]
  const Icon =
    data.overall.verdict === 'malicious'
      ? ShieldAlert
      : data.overall.verdict === 'suspicious'
        ? AlertTriangle
        : data.overall.verdict === 'clean'
          ? ShieldCheck
          : ShieldQuestion

  return (
    <div className="flex flex-col gap-6">
      {/* overall verdict */}
      <div
        className={cn(
          'rounded-[6px] border p-4',
          v.border,
          v.bg,
        )}
      >
        <div className="flex items-start gap-3">
          <Icon size={18} aria-hidden className={cn('mt-0.5', v.fg)} />
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-baseline gap-3">
              <span
                className={cn(
                  'font-mono text-[12px] uppercase tracking-[0.1em]',
                  v.fg,
                )}
              >
                Overall verdict · {v.label}
              </span>
              <span className="font-mono text-[11px] text-[var(--cosmos-text-muted)]">
                risk score {data.overall.score}/100
              </span>
              <span className="ml-auto font-mono text-[11px] text-[var(--cosmos-text-dim)]">
                kind: {KIND_LABEL[data.kind]}
              </span>
            </div>
            <div className="flex items-start gap-2 font-mono text-[12px] text-[var(--cosmos-text)]">
              <span className="min-w-0 flex-1 break-all">{data.normalized}</span>
              <CopyButton value={data.normalized} />
            </div>
            {data.overall.reasons.length > 0 ? (
              <ul className="mt-2 flex flex-col gap-0.5 font-mono text-[11px] text-[var(--cosmos-text-muted)]">
                {data.overall.reasons.map((r, i) => (
                  <li key={i}>· {r}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>

      {/* per-source grid */}
      {data.sources.length === 0 ? (
        <p className="rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-4 font-mono text-[12px] text-[var(--cosmos-text-muted)]">
          No sources matched this kind of input. Try an IP, domain, URL, file
          hash, or email.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {data.sources.map((s) => (
            <SourceCard
              key={s.source}
              source={s}
              parentKind={data.kind}
              parentValue={data.normalized}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SourceCard({
  source,
  parentKind,
  parentValue,
}: {
  source: SourceReport
  parentKind: LookupKind
  parentValue: string
}) {
  const v = source.verdict ? VERDICT_STYLE[source.verdict] : null
  const showLiveScan = source.source === 'urlscan' && parentKind === 'url'
  return (
    <article
      className={cn(
        'flex flex-col gap-3 rounded-[6px] border bg-[var(--cosmos-bg-elevated)] p-4',
        v?.border ?? 'border-[var(--cosmos-border)]',
      )}
    >
      <header className="flex items-start gap-2">
        <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--cosmos-text)]">
          {source.label}
        </span>
        {v ? (
          <span
            className={cn(
              'rounded-full border px-2 py-[1px] font-mono text-[9px] uppercase tracking-[0.12em]',
              v.border,
              v.fg,
            )}
          >
            {v.label}
          </span>
        ) : null}
        <StatusPill status={source.status} />
        {typeof source.durationMs === 'number' ? (
          <span className="ml-auto font-mono text-[10px] text-[var(--cosmos-text-dim)]">
            {source.durationMs}ms
          </span>
        ) : null}
      </header>

      {source.summary ? (
        <p className="font-mono text-[12px] leading-relaxed text-[var(--cosmos-text-muted)]">
          {source.summary}
        </p>
      ) : null}

      {source.message ? (
        <p className="font-mono text-[11px] text-[var(--cosmos-text-dim)]">
          {source.message}
        </p>
      ) : null}

      {source.fields && source.fields.length > 0 ? (
        <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
          {source.fields.map((f, i) =>
            f.value == null || f.value === '' ? null : (
              <FieldRow key={i} field={f} />
            ),
          )}
        </dl>
      ) : null}

      {source.reportUrl ? (
        <a
          href={source.reportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[var(--cosmos-accent)] hover:underline"
        >
          <ExternalLink size={11} aria-hidden /> Open full {source.label} report
        </a>
      ) : null}

      {showLiveScan ? <UrlscanLiveScan url={parentValue} /> : null}
    </article>
  )
}

function FieldRow({ field }: { field: ReportField }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--cosmos-text-dim)]">
        {field.label}
      </dt>
      <dd
        className={cn(
          'min-w-0 break-words text-[12px] text-[var(--cosmos-text)]',
          field.mono !== false ? 'font-mono' : '',
        )}
        title={String(field.value)}
      >
        {field.href ? (
          <a
            href={field.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--cosmos-accent)] hover:underline"
          >
            {String(field.value)}
          </a>
        ) : (
          String(field.value)
        )}
      </dd>
    </div>
  )
}

function StatusPill({ status }: { status: SourceReport['status'] }) {
  const map: Record<SourceReport['status'], { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
    ok: {
      label: 'live',
      cls: 'border-[var(--cosmos-low)]/40 text-[var(--cosmos-low)]',
      Icon: CheckCircle2,
    },
    no_data: {
      label: 'no data',
      cls: 'border-[var(--cosmos-border)] text-[var(--cosmos-text-dim)]',
      Icon: ShieldQuestion,
    },
    error: {
      label: 'error',
      cls: 'border-[var(--cosmos-critical)]/40 text-[var(--cosmos-critical)]',
      Icon: AlertTriangle,
    },
    skipped: {
      label: 'skipped',
      cls: 'border-[var(--cosmos-border)] text-[var(--cosmos-text-dim)]',
      Icon: ShieldQuestion,
    },
    unconfigured: {
      label: 'no key',
      cls: 'border-[var(--cosmos-medium)]/40 text-[var(--cosmos-medium)]',
      Icon: AlertTriangle,
    },
  }
  const m = map[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-[1px] font-mono text-[9px] uppercase tracking-[0.12em]',
        m.cls,
      )}
    >
      <m.Icon size={9} aria-hidden /> {m.label}
    </span>
  )
}
