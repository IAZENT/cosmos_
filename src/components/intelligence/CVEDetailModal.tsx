'use client'

import { Check, ExternalLink, Link2, Share2, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { SeverityBadge } from '@/components/ui/SeverityBadge'
import { formatRelative, formatUTC } from '@/lib/utils/date'
import {
  normalizeSeverity,
  severityVarMap,
  type Severity,
} from '@/lib/utils/severity'
import type { CVEFeedRow } from '@/app/api/intelligence/cves/route'

function safeStringArray(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    // NVD frequently lists the same advisory URL under multiple tag
    // categories  dedupe so React keys stay unique in the rendered list.
    return Array.from(
      new Set(raw.filter((v): v is string => typeof v === 'string')),
    )
  }
  return []
}

function CVSSRing({
  score,
  severity,
}: {
  score: number | null
  severity: Severity
}) {
  const max = 10
  const safe =
    score != null && !Number.isNaN(score) ? Math.max(0, Math.min(max, score)) : 0
  const pct = Math.round((safe / max) * 100)
  const color = severityVarMap[severity]
  return (
    <div
      className="relative grid h-[132px] w-[132px] place-items-center rounded-full"
      style={{
        background: `conic-gradient(${color} ${pct}%, var(--cosmos-bg-subtle) ${pct}%)`,
      }}
      aria-label={`CVSS score ${safe.toFixed(1)} of ${max}`}
    >
      <div className="grid h-[108px] w-[108px] place-items-center rounded-full bg-[var(--cosmos-bg-elevated)]">
        <div className="text-center">
          <div className="font-mono text-[28px] leading-none text-[var(--cosmos-text)]">
            {score != null ? score.toFixed(1) : ''}
          </div>
          <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--cosmos-text-dim)]">
            CVSS / 10
          </div>
        </div>
      </div>
    </div>
  )
}

export function CVEDetailModal({
  cve,
  onClose,
}: {
  cve: CVEFeedRow | null
  onClose: () => void
}) {
  const [shared, setShared] = useState(false)

  useEffect(() => {
    if (!cve) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [cve, onClose])

  if (!cve) return null

  const severity = normalizeSeverity(cve.cvss_severity ?? null)
  const references = safeStringArray(cve.references)

  const handleShare = async () => {
    try {
      // Copy the canonical permalink rather than the modal-deep-link
      // querystring. This makes shared links survive a future modal
      // refactor and improves SEO previews when the link is posted.
      const origin =
        typeof window !== 'undefined' ? window.location.origin : ''
      await navigator.clipboard.writeText(
        `${origin}/intelligence/cve/${cve.cve_id}`,
      )
      setShared(true)
      window.setTimeout(() => setShared(false), 1500)
    } catch {
      /* no-op */
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${cve.cve_id} details`}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 md:items-center"
      onClick={onClose}
    >
      <div
        className="relative mx-auto w-full max-w-3xl rounded-[8px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-mono text-[18px] text-[var(--cosmos-text)]">
                {cve.cve_id}
              </h2>
              <SeverityBadge level={severity} />
              {cve.is_kev ? (
                <span className="rounded-full border border-[var(--cosmos-critical)] px-2 py-[2px] font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-critical)]">
                  KEV
                </span>
              ) : null}
            </div>
            <p className="mt-1 font-mono text-[11px] text-[var(--cosmos-text-dim)]">
              published {formatUTC(cve.published_at)} · {formatRelative(cve.published_at)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-[4px] border border-[var(--cosmos-border)] p-1.5 text-[var(--cosmos-text-muted)] hover:border-[var(--cosmos-text-dim)] hover:text-[var(--cosmos-text)]"
          >
            <X size={14} />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-[auto_1fr]">
          <div className="flex justify-center">
            <CVSSRing score={cve.cvss_score} severity={severity} />
          </div>
          <div>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-code)]">
              {'// description'}
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--cosmos-text-muted)]">
              {cve.description ?? ''}
            </p>

            {cve.is_kev && cve.kev_action ? (
              <div className="mt-4 rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-critical)]">
                  {'// required action (CISA KEV)'}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-[var(--cosmos-text-muted)]">
                  {cve.kev_action}
                </p>
                {cve.kev_added_at ? (
                  <p className="mt-2 font-mono text-[10px] text-[var(--cosmos-text-dim)]">
                    added {formatUTC(cve.kev_added_at)}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {references.length > 0 ? (
          <div className="mt-6 border-t border-[var(--cosmos-border-dim)] pt-4">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-code)]">
              {'// references'}
            </h3>
            <ul className="mt-2 flex flex-col gap-1.5">
              {references.map((href) => (
                <li key={href}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[var(--cosmos-text-muted)] hover:text-[var(--cosmos-text)]"
                  >
                    <ExternalLink size={11} aria-hidden />
                    <span className="max-w-[40rem] truncate">{href}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
          <Link
            href={`/intelligence/cve/${cve.cve_id}`}
            className="cosmos-btn-ghost"
            onClick={onClose}
          >
            <Link2 size={12} aria-hidden />
            Open permalink
          </Link>
          <button
            type="button"
            onClick={handleShare}
            className="cosmos-btn-ghost"
          >
            {shared ? (
              <Check size={12} aria-hidden />
            ) : (
              <Share2 size={12} aria-hidden />
            )}
            {shared ? 'Link copied' : 'Share'}
          </button>
          <a
            href={`https://nvd.nist.gov/vuln/detail/${cve.cve_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="cosmos-btn-primary"
          >
            <ExternalLink size={12} aria-hidden />
            NVD detail
          </a>
        </div>
      </div>
    </div>
  )
}
