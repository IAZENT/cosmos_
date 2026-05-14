'use client'

import { useState } from 'react'
import { Check, ChevronDown, ChevronUp, Copy } from 'lucide-react'
import {
  CATEGORY_LABEL,
  DIFFICULTY_STYLE,
} from '@/lib/arsenal/constants'
import type { ArsenalEntry } from '@/types/arsenal'

interface Props {
  entry: ArsenalEntry
  index?: number
}

async function recordCopy(id: string) {
  try {
    await fetch('/api/arsenal/usage', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id }),
      keepalive: true,
    })
  } catch {
    /* fire-and-forget */
  }
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fall through */
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    return true
  } catch {
    return false
  }
}

export function ArsenalEntryCard({ entry, index }: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const onCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const ok = await copyText(entry.command)
    if (!ok) return
    setCopied(true)
    void recordCopy(entry.id)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const diff = DIFFICULTY_STYLE[entry.difficulty]
  const indexLabel =
    typeof index === 'number'
      ? `(${String(index + 1).padStart(2, '0')})`
      : null

  return (
    <article
      className="group rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-4 transition-colors hover:border-[var(--cosmos-text-dim)]"
      onClick={() => setOpen((v) => !v)}
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-baseline gap-2">
          {indexLabel ? (
            <span className="font-mono text-[10px] text-[var(--cosmos-text-dim)]">
              {indexLabel}
            </span>
          ) : null}
          {entry.pinned ? (
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-accent)]">
              pinned
            </span>
          ) : null}
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-code)]">
            {`// ${CATEGORY_LABEL[entry.category] ?? entry.category}`}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className="rounded-[3px] px-1.5 py-[2px] font-mono text-[9px] uppercase tracking-[0.12em]"
            style={{ background: diff.bg, color: diff.fg }}
          >
            {diff.label}
          </span>
          {entry.platform.map((p) => (
            <span
              key={p}
              className="rounded-[3px] border border-[var(--cosmos-border)] px-1.5 py-[2px] font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--cosmos-text-muted)]"
            >
              {p}
            </span>
          ))}
        </div>
      </header>

      <div className="mt-2 flex items-start justify-between gap-3">
        <h3 className="text-[15px] leading-snug text-[var(--cosmos-text)]">
          {entry.title}
        </h3>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onCopy}
            aria-label="Copy command"
            className="flex h-7 w-7 items-center justify-center rounded-[4px] border border-[var(--cosmos-border)] text-[var(--cosmos-text-muted)] hover:border-[var(--cosmos-text-dim)] hover:text-[var(--cosmos-text)]"
          >
            {copied ? (
              <Check size={12} className="text-[var(--cosmos-low)]" />
            ) : (
              <Copy size={12} />
            )}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setOpen((v) => !v)
            }}
            aria-label={open ? 'Collapse' : 'Expand'}
            className="flex h-7 w-7 items-center justify-center rounded-[4px] border border-[var(--cosmos-border)] text-[var(--cosmos-text-muted)] hover:border-[var(--cosmos-text-dim)] hover:text-[var(--cosmos-text)]"
          >
            {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      {entry.description ? (
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--cosmos-text-muted)]">
          {entry.description}
        </p>
      ) : null}

      {open ? (
        <div
          className="mt-3 flex flex-col gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-[4px] border border-[var(--cosmos-border-dim)] bg-[var(--cosmos-bg)] px-4 py-3 font-mono text-[13px] leading-relaxed text-[var(--cosmos-text)]">
            {entry.command}
          </pre>
          {entry.note ? (
            <p className="border-l-2 border-[var(--cosmos-accent-dim)] pl-3 text-[13px] leading-relaxed text-[var(--cosmos-text-muted)]">
              <span className="text-[var(--cosmos-accent)]">↳</span> {entry.note}
            </p>
          ) : null}
          {entry.mitre_id ? (
            <p className="font-mono text-[11px] text-[var(--cosmos-text-dim)]">
              MITRE:{' '}
              <span className="text-[var(--cosmos-accent)]">
                {entry.mitre_id}
              </span>
              {entry.mitre_name ? `  ${entry.mitre_name}` : null}
            </p>
          ) : null}
          {entry.source_url ? (
            <p className="font-mono text-[11px]">
              <span className="text-[var(--cosmos-text-dim)]">source: </span>
              <a
                href={entry.source_url}
                target="_blank"
                rel="noreferrer noopener"
                className="text-[var(--cosmos-accent)] hover:underline"
              >
                {entry.source_url}
              </a>
            </p>
          ) : null}
        </div>
      ) : null}

      {entry.tags.length > 0 || entry.usage_count > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {entry.tags.slice(0, 8).map((t) => (
            <span
              key={t}
              className="rounded-full border border-[var(--cosmos-border)] px-2 py-[2px] font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--cosmos-text-muted)]"
            >
              {t}
            </span>
          ))}
          {entry.usage_count > 0 ? (
            <span className="ml-auto font-mono text-[10px] text-[var(--cosmos-text-dim)]">
              copied {entry.usage_count.toLocaleString('en-US')}×
            </span>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}
