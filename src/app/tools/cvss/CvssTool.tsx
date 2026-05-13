'use client'

import { useMemo, useState } from 'react'
import { CopyButton } from '@/components/tools/CopyButton'
import { SeverityBadge } from '@/components/ui/SeverityBadge'
import {
  DEFAULT_VECTOR,
  calculateCvss,
  parseCvssVector,
  type CvssVector,
} from '@/lib/tools/cvss'
import { severityVarMap } from '@/lib/utils/severity'
import { cn } from '@/lib/utils/cn'

interface MetricDef<K extends keyof CvssVector> {
  key: K
  label: string
  options: { value: CvssVector[K]; label: string; hint?: string }[]
}

const METRICS: [
  MetricDef<'AV'>,
  MetricDef<'AC'>,
  MetricDef<'PR'>,
  MetricDef<'UI'>,
  MetricDef<'S'>,
  MetricDef<'C'>,
  MetricDef<'I'>,
  MetricDef<'A'>,
] = [
  {
    key: 'AV',
    label: 'Attack Vector',
    options: [
      { value: 'N', label: 'Network' },
      { value: 'A', label: 'Adjacent' },
      { value: 'L', label: 'Local' },
      { value: 'P', label: 'Physical' },
    ],
  },
  {
    key: 'AC',
    label: 'Attack Complexity',
    options: [
      { value: 'L', label: 'Low' },
      { value: 'H', label: 'High' },
    ],
  },
  {
    key: 'PR',
    label: 'Privileges Required',
    options: [
      { value: 'N', label: 'None' },
      { value: 'L', label: 'Low' },
      { value: 'H', label: 'High' },
    ],
  },
  {
    key: 'UI',
    label: 'User Interaction',
    options: [
      { value: 'N', label: 'None' },
      { value: 'R', label: 'Required' },
    ],
  },
  {
    key: 'S',
    label: 'Scope',
    options: [
      { value: 'U', label: 'Unchanged' },
      { value: 'C', label: 'Changed' },
    ],
  },
  {
    key: 'C',
    label: 'Confidentiality',
    options: [
      { value: 'H', label: 'High' },
      { value: 'L', label: 'Low' },
      { value: 'N', label: 'None' },
    ],
  },
  {
    key: 'I',
    label: 'Integrity',
    options: [
      { value: 'H', label: 'High' },
      { value: 'L', label: 'Low' },
      { value: 'N', label: 'None' },
    ],
  },
  {
    key: 'A',
    label: 'Availability',
    options: [
      { value: 'H', label: 'High' },
      { value: 'L', label: 'Low' },
      { value: 'N', label: 'None' },
    ],
  },
]

export function CvssTool() {
  const [vector, setVector] = useState<CvssVector>(DEFAULT_VECTOR)
  const [importInput, setImportInput] = useState('')
  const [importError, setImportError] = useState<string | null>(null)

  const result = useMemo(() => calculateCvss(vector), [vector])

  const setMetric = <K extends keyof CvssVector>(
    key: K,
    value: CvssVector[K],
  ) => setVector((v) => ({ ...v, [key]: value }))

  const handleImport = () => {
    const parsed = parseCvssVector(importInput.trim())
    if (!parsed) {
      setImportError('Not a valid CVSS:3.1 vector string.')
      return
    }
    setVector(parsed)
    setImportError(null)
    setImportInput('')
  }

  const severityColor = severityVarMap[result.severity] ?? 'var(--cosmos-text-dim)'

  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-1 gap-4 rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-6 md:grid-cols-[auto_1fr]">
        <ScoreRing score={result.baseScore} color={severityColor} />
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--cosmos-code)]">
              {'// base score'}
            </span>
            <SeverityBadge level={result.severity} />
          </div>
          <div className="flex flex-wrap items-baseline gap-4 font-mono text-[12px] text-[var(--cosmos-text-muted)]">
            <span>
              impact ·{' '}
              <span className="text-[var(--cosmos-text)]">
                {result.impactSubScore.toFixed(1)}
              </span>
            </span>
            <span>
              exploitability ·{' '}
              <span className="text-[var(--cosmos-text)]">
                {result.exploitabilitySubScore.toFixed(1)}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] px-3 py-2 font-mono text-[12px] text-[var(--cosmos-text)]">
              {result.vector}
            </code>
            <CopyButton value={result.vector} size="md" />
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-[var(--cosmos-border-dim)] pt-3">
            <input
              type="text"
              value={importInput}
              onChange={(e) => setImportInput(e.target.value)}
              placeholder="Paste a CVSS:3.1/… vector to import"
              className="min-w-0 flex-1 rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] px-3 py-2 font-mono text-[12px] text-[var(--cosmos-text)]"
            />
            <button
              type="button"
              onClick={handleImport}
              className="cosmos-btn-ghost"
            >
              Import
            </button>
          </div>
          {importError ? (
            <p
              role="alert"
              className="rounded-[4px] border border-[var(--cosmos-critical)]/40 bg-[var(--cosmos-critical)]/10 px-3 py-2 font-mono text-[11px] text-[var(--cosmos-critical)]"
            >
              {importError}
            </p>
          ) : null}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {METRICS.map((m) => (
          <MetricPicker
            key={m.key}
            def={m}
            value={vector[m.key]}
            onChange={(v) => setMetric(m.key, v)}
          />
        ))}
      </section>
    </div>
  )
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const pct = Math.max(0, Math.min(100, (score / 10) * 100))
  return (
    <div
      className="grid h-[140px] w-[140px] place-items-center rounded-full"
      style={{
        background: `conic-gradient(${color} ${pct}%, var(--cosmos-bg-subtle) ${pct}%)`,
      }}
      aria-label={`Base score ${score.toFixed(1)} of 10`}
    >
      <div className="grid h-[116px] w-[116px] place-items-center rounded-full bg-[var(--cosmos-bg-elevated)]">
        <div className="text-center">
          <div className="font-mono text-[28px] leading-none text-[var(--cosmos-text)]">
            {score.toFixed(1)}
          </div>
          <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--cosmos-text-dim)]">
            CVSS / 10
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricPicker<K extends keyof CvssVector>({
  def,
  value,
  onChange,
}: {
  def: MetricDef<K>
  value: CvssVector[K]
  onChange: (v: CvssVector[K]) => void
}) {
  return (
    <div className="rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
          {def.label}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-code)]">
          {def.key}
        </p>
      </div>
      <div
        role="radiogroup"
        aria-label={def.label}
        className="mt-3 flex flex-wrap gap-2"
      >
        {def.options.map((opt) => {
          const active = opt.value === value
          return (
            <button
              key={String(opt.value)}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt.value)}
              className={cn(
                'rounded-[4px] border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors',
                active
                  ? 'border-[var(--cosmos-accent)] text-[var(--cosmos-accent)]'
                  : 'border-[var(--cosmos-border)] text-[var(--cosmos-text-muted)] hover:border-[var(--cosmos-text-dim)] hover:text-[var(--cosmos-text)]',
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
