'use client'

import { useMemo, useState } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { CopyButton } from '@/components/tools/CopyButton'
import { cn } from '@/lib/utils/cn'

type Mode = 'encode' | 'decode'
type Strength = 'component' | 'uri'

export function UrlTool() {
  const [mode, setMode] = useState<Mode>('encode')
  const [strength, setStrength] = useState<Strength>('component')
  const [input, setInput] = useState('')

  const result = useMemo(() => {
    if (!input) return { output: '', error: null as string | null }
    try {
      if (mode === 'encode') {
        const output =
          strength === 'component'
            ? encodeURIComponent(input)
            : encodeURI(input)
        return { output, error: null }
      }
      const output =
        strength === 'component'
          ? decodeURIComponent(input)
          : decodeURI(input)
      return { output, error: null }
    } catch (err) {
      return {
        output: '',
        error:
          err instanceof Error
            ? err.message
            : 'Malformed percent-encoded input.',
      }
    }
  }, [input, mode, strength])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-3">
        <div className="flex items-center gap-1 rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] p-0.5">
          {(['encode', 'decode'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                'rounded-[3px] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors',
                mode === m
                  ? 'bg-[var(--cosmos-accent-dim)] text-[var(--cosmos-accent)]'
                  : 'text-[var(--cosmos-text-muted)] hover:text-[var(--cosmos-text)]',
              )}
            >
              {m}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setMode((m) => (m === 'encode' ? 'decode' : 'encode'))}
          className="cosmos-btn-ghost"
        >
          <ArrowLeftRight size={12} aria-hidden /> swap
        </button>
        <div className="ml-auto flex items-center gap-1 rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] p-0.5">
          {(
            [
              { key: 'component', label: 'Component' },
              { key: 'uri', label: 'Full URI' },
            ] as const
          ).map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setStrength(s.key)}
              className={cn(
                'rounded-[3px] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors',
                strength === s.key
                  ? 'bg-[var(--cosmos-accent-dim)] text-[var(--cosmos-accent)]'
                  : 'text-[var(--cosmos-text-muted)] hover:text-[var(--cosmos-text)]',
              )}
              title={
                s.key === 'component'
                  ? 'encodeURIComponent: encode reserved characters too'
                  : 'encodeURI: preserve reserved characters like / : ?'
              }
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
              Input
            </span>
            <span className="font-mono text-[10px] text-[var(--cosmos-text-dim)]">
              {input.length} chars
            </span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={14}
            placeholder={
              mode === 'encode'
                ? 'https://example.com/path?q=hello world'
                : 'https%3A%2F%2Fexample.com%2Fpath%3Fq%3Dhello%20world'
            }
            className="rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] p-3 font-mono text-[13px] leading-relaxed text-[var(--cosmos-text)]"
            spellCheck={false}
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
              Output
            </span>
            <CopyButton value={result.output} />
          </div>
          <textarea
            value={result.output}
            readOnly
            rows={14}
            placeholder=""
            className="rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] p-3 font-mono text-[13px] leading-relaxed text-[var(--cosmos-text)]"
            spellCheck={false}
          />
          {result.error ? (
            <p
              role="alert"
              className="rounded-[4px] border border-[var(--cosmos-critical)]/40 bg-[var(--cosmos-critical)]/10 px-3 py-2 font-mono text-[11px] text-[var(--cosmos-critical)]"
            >
              {result.error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
