'use client'

import { useMemo, useState } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { CopyButton } from '@/components/tools/CopyButton'
import { cn } from '@/lib/utils/cn'

type Mode = 'encode' | 'decode'

function toBase64(input: string, urlSafe: boolean): string {
  // encodeURIComponent produces %XX sequences for non-ASCII; unescape
  // converts them back to raw bytes before btoa.
   
  const binary = unescape(encodeURIComponent(input))
  let out = btoa(binary)
  if (urlSafe) {
    out = out.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
  }
  return out
}

function fromBase64(input: string, urlSafe: boolean): string {
  let s = input.trim()
  if (urlSafe) {
    s = s.replace(/-/g, '+').replace(/_/g, '/')
    const pad = s.length % 4
    if (pad === 2) s += '=='
    else if (pad === 3) s += '='
    else if (pad === 1) throw new Error('Invalid base64 length.')
  }
  const binary = atob(s)
   
  return decodeURIComponent(escape(binary))
}

export function Base64Tool() {
  const [mode, setMode] = useState<Mode>('encode')
  const [urlSafe, setUrlSafe] = useState(false)
  const [input, setInput] = useState('')

  const result = useMemo(() => {
    if (!input) return { output: '', error: null as string | null }
    try {
      const output =
        mode === 'encode'
          ? toBase64(input, urlSafe)
          : fromBase64(input, urlSafe)
      return { output, error: null }
    } catch (err) {
      return {
        output: '',
        error:
          err instanceof Error
            ? err.message
            : 'Invalid base64 input.',
      }
    }
  }, [input, mode, urlSafe])

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
          aria-label="Swap mode"
        >
          <ArrowLeftRight size={12} aria-hidden /> swap
        </button>
        <label className="ml-auto flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--cosmos-text-muted)]">
          <input
            type="checkbox"
            checked={urlSafe}
            onChange={(e) => setUrlSafe(e.target.checked)}
            className="h-3 w-3 accent-[var(--cosmos-accent)]"
          />
          URL-safe
        </label>
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
                ? 'UTF-8 text to encode…'
                : 'Base64 string to decode…'
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
