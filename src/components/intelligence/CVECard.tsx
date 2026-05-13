'use client'

import { Check, Copy, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { CosmosCard } from '@/components/ui/CosmosCard'
import { SeverityBadge } from '@/components/ui/SeverityBadge'
import { formatRelative } from '@/lib/utils/date'
import { normalizeSeverity } from '@/lib/utils/severity'
import type { CVEFeedRow } from '@/app/api/intelligence/cves/route'

function safeReferences(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    // NVD lists the same advisory URL under multiple tag categories 
    // dedupe so the slice(0,3) preview never shows the same link twice
    // and React keys stay unique.
    return Array.from(
      new Set(raw.filter((v): v is string => typeof v === 'string')),
    )
  }
  return []
}

export function CVECard({
  cve,
  onSelect,
}: {
  cve: CVEFeedRow
  onSelect: (cve: CVEFeedRow) => void
}) {
  const [copied, setCopied] = useState(false)
  const severity = normalizeSeverity(cve.cvss_severity ?? null)
  const refs = safeReferences(cve.references).slice(0, 3)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(cve.cve_id)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard may be unavailable (insecure context) */
    }
  }

  return (
    <CosmosCard
      as="article"
      interactive
      className="cursor-pointer"
      onClick={() => onSelect(cve)}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-[13px] text-[var(--cosmos-text)]">
            {cve.cve_id}
          </span>
          <SeverityBadge level={severity} />
          {cve.is_kev ? (
            <span className="rounded-full border border-[var(--cosmos-critical)] px-2 py-[2px] font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-critical)]">
              KEV
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-3 text-right">
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-[22px] leading-none text-[var(--cosmos-text)]">
              {cve.cvss_score != null ? cve.cvss_score.toFixed(1) : ''}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
              CVSS
            </span>
          </div>
        </div>
      </div>

      <p className="mt-4 text-[13px] leading-relaxed text-[var(--cosmos-text-muted)]">
        {cve.description ?? ''}
      </p>

      {cve.is_kev && cve.kev_action ? (
        <div className="mt-4 rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] p-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-critical)]">
            {'// required action'}
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--cosmos-text-muted)]">
            {cve.kev_action}
          </p>
        </div>
      ) : null}

      {refs.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-1.5">
          {refs.map((href) => (
            <li key={href}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[var(--cosmos-text-muted)] hover:text-[var(--cosmos-text)]"
              >
                <ExternalLink size={11} aria-hidden />
                <span className="max-w-[32rem] truncate">{href}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex items-center justify-between">
        <span className="font-mono text-[11px] text-[var(--cosmos-text-dim)]">
          published {formatRelative(cve.published_at)}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-[4px] border border-[var(--cosmos-border)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-muted)] hover:text-[var(--cosmos-text)]"
          aria-label={`Copy ${cve.cve_id}`}
        >
          {copied ? (
            <Check size={11} aria-hidden />
          ) : (
            <Copy size={11} aria-hidden />
          )}
          {copied ? 'copied' : 'copy id'}
        </button>
      </div>
    </CosmosCard>
  )
}
