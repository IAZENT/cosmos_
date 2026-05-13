'use client'

import { useEffect, useMemo, useState } from 'react'
import { CopyButton } from '@/components/tools/CopyButton'
import { cn } from '@/lib/utils/cn'

type Mode = 'identify' | 'compute'

interface HashHeuristic {
  name: string
  length: number
  alphabet: 'hex' | 'base64' | 'mixed'
  confidence: 'high' | 'medium' | 'low'
  note?: string
}

const HEX_SIGNATURES: HashHeuristic[] = [
  { name: 'CRC-32', length: 8, alphabet: 'hex', confidence: 'low' },
  { name: 'MD4', length: 32, alphabet: 'hex', confidence: 'low' },
  { name: 'MD5', length: 32, alphabet: 'hex', confidence: 'high' },
  { name: 'NTLM', length: 32, alphabet: 'hex', confidence: 'medium', note: 'Windows credential hash.' },
  { name: 'RIPEMD-160', length: 40, alphabet: 'hex', confidence: 'low' },
  { name: 'SHA-1', length: 40, alphabet: 'hex', confidence: 'high' },
  { name: 'Tiger-192', length: 48, alphabet: 'hex', confidence: 'low' },
  { name: 'SHA-224', length: 56, alphabet: 'hex', confidence: 'medium' },
  { name: 'SHA-256', length: 64, alphabet: 'hex', confidence: 'high' },
  { name: 'SHA-384', length: 96, alphabet: 'hex', confidence: 'high' },
  { name: 'SHA-512', length: 128, alphabet: 'hex', confidence: 'high' },
  { name: 'Whirlpool', length: 128, alphabet: 'hex', confidence: 'low' },
]

function looksHex(s: string): boolean {
  return /^[0-9a-fA-F]+$/.test(s)
}

function detect(raw: string): HashHeuristic[] {
  const s = raw.trim()
  if (!s) return []
  // bcrypt: $2a$, $2b$, $2y$ prefix, 60 chars
  if (/^\$2[abxy]?\$\d{1,2}\$[./A-Za-z0-9]{53}$/.test(s)) {
    return [
      {
        name: 'bcrypt',
        length: s.length,
        alphabet: 'mixed',
        confidence: 'high',
        note: 'Adaptive password hash; cost factor in the 3rd field.',
      },
    ]
  }
  // argon2
  if (/^\$argon2(id|i|d)\$/.test(s)) {
    return [
      {
        name: 'Argon2',
        length: s.length,
        alphabet: 'mixed',
        confidence: 'high',
        note: 'Password hash with embedded parameters.',
      },
    ]
  }
  // scrypt
  if (/^\$scrypt\$/.test(s) || /^\$s2\$/.test(s)) {
    return [
      {
        name: 'scrypt',
        length: s.length,
        alphabet: 'mixed',
        confidence: 'high',
      },
    ]
  }
  // PHC SHA-crypt (e.g. $6$)
  if (/^\$[156]\$/.test(s)) {
    const variant = s.startsWith('$1$')
      ? 'md5crypt'
      : s.startsWith('$5$')
        ? 'SHA-256 crypt'
        : 'SHA-512 crypt'
    return [
      {
        name: variant,
        length: s.length,
        alphabet: 'mixed',
        confidence: 'high',
      },
    ]
  }
  if (looksHex(s)) {
    return HEX_SIGNATURES.filter((h) => h.length === s.length)
  }
  // base64-ish  reject hashing only based on length (too ambiguous).
  if (/^[A-Za-z0-9+/=]{40,}$/.test(s)) {
    return [
      {
        name: 'Base64 blob',
        length: s.length,
        alphabet: 'base64',
        confidence: 'low',
        note: 'Non-hex input; could be a signature, MAC, or encoded ciphertext.',
      },
    ]
  }
  return []
}

type Algo = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'

const ALGOS: Algo[] = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']

async function computeHash(algo: Algo, text: string): Promise<string> {
  const enc = new TextEncoder().encode(text)
  const buf = await crypto.subtle.digest(algo, enc)
  const bytes = new Uint8Array(buf)
  let out = ''
  for (let i = 0; i < bytes.length; i += 1) {
    out += (bytes[i] ?? 0).toString(16).padStart(2, '0')
  }
  return out
}

export function HashTool() {
  const [mode, setMode] = useState<Mode>('identify')

  return (
    <div className="flex flex-col gap-6">
      <div className="inline-flex w-fit items-center gap-1 rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-0.5">
        {(['identify', 'compute'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              'rounded-[3px] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors',
              mode === m
                ? 'bg-[var(--cosmos-accent-dim)] text-[var(--cosmos-accent)]'
                : 'text-[var(--cosmos-text-muted)] hover:text-[var(--cosmos-text)]',
            )}
          >
            {m}
          </button>
        ))}
      </div>

      {mode === 'identify' ? <IdentifyPanel /> : <ComputePanel />}
    </div>
  )
}

function IdentifyPanel() {
  const [raw, setRaw] = useState('')
  const matches = useMemo(() => detect(raw), [raw])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
            Hash to identify
          </span>
          <span className="font-mono text-[10px] text-[var(--cosmos-text-dim)]">
            {raw.trim().length} chars
          </span>
        </div>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={4}
          placeholder="5d41402abc4b2a76b9719d911017c592"
          className="rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] p-3 font-mono text-[13px] text-[var(--cosmos-text)] break-all"
          spellCheck={false}
        />
      </div>

      {raw.trim() ? (
        <section className="rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--cosmos-code)]">
            {`// ${matches.length === 0 ? 'no match' : matches.length === 1 ? '1 candidate' : `${matches.length} candidates`}`}
          </p>
          {matches.length === 0 ? (
            <p className="mt-3 text-[13px] leading-relaxed text-[var(--cosmos-text-muted)]">
              No known hash pattern matches this input. Check for extra
              whitespace or prefixes (e.g.{' '}
              <code className="rounded bg-[var(--cosmos-bg-subtle)] px-1 font-mono text-[11px]">
                $2a$
              </code>
              , hex only, no
              <code className="mx-1 rounded bg-[var(--cosmos-bg-subtle)] px-1 font-mono text-[11px]">
                0x
              </code>
              prefix).
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {matches.map((m) => (
                <li
                  key={m.name}
                  className="flex flex-col gap-1 rounded-[4px] border border-[var(--cosmos-border-dim)] bg-[var(--cosmos-bg-subtle)] p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[13px] text-[var(--cosmos-text)]">
                      {m.name}
                    </span>
                    <span
                      className={cn(
                        'font-mono text-[10px] uppercase tracking-[0.12em]',
                        m.confidence === 'high'
                          ? 'text-[var(--cosmos-low)]'
                          : m.confidence === 'medium'
                            ? 'text-[var(--cosmos-medium)]'
                            : 'text-[var(--cosmos-text-dim)]',
                      )}
                    >
                      {m.confidence}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[var(--cosmos-text-dim)]">
                    {m.length} chars · {m.alphabet}
                  </span>
                  {m.note ? (
                    <span className="text-[12px] leading-relaxed text-[var(--cosmos-text-muted)]">
                      {m.note}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  )
}

function ComputePanel() {
  const [input, setInput] = useState('')
  const [results, setResults] = useState<Record<Algo, string>>({
    'SHA-1': '',
    'SHA-256': '',
    'SHA-384': '',
    'SHA-512': '',
  })

  useEffect(() => {
    let cancelled = false
    if (!input) {
      // Reset cleared rather than left stale when the user empties the
      // input. Effect returns immediately so there's no cascade  silence
      // the strict React 19 hooks rule.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults({ 'SHA-1': '', 'SHA-256': '', 'SHA-384': '', 'SHA-512': '' })
      return
    }
    ;(async () => {
      try {
        const entries = await Promise.all(
          ALGOS.map(async (a) => [a, await computeHash(a, input)] as const),
        )
        if (cancelled) return
        const next: Record<Algo, string> = {
          'SHA-1': '',
          'SHA-256': '',
          'SHA-384': '',
          'SHA-512': '',
        }
        for (const [a, h] of entries) next[a] = h
        setResults(next)
      } catch {
        /* subtle crypto unavailable (insecure context) */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [input])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
            Input text (UTF-8)
          </span>
          <span className="font-mono text-[10px] text-[var(--cosmos-text-dim)]">
            {input.length} chars
          </span>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={6}
          placeholder="hello world"
          className="rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] p-3 font-mono text-[13px] leading-relaxed text-[var(--cosmos-text)]"
          spellCheck={false}
        />
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
          {'// md5 is not available via web crypto. use sha-256 for modern use cases.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {ALGOS.map((a) => (
          <div
            key={a}
            className="flex flex-col gap-2 rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-4"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[12px] text-[var(--cosmos-text)]">
                {a}
              </span>
              <CopyButton value={results[a]} />
            </div>
            <pre className="break-all rounded-[4px] border border-[var(--cosmos-border-dim)] bg-[var(--cosmos-bg-subtle)] p-3 font-mono text-[12px] leading-relaxed text-[var(--cosmos-text-muted)]">
              {results[a] || ''}
            </pre>
          </div>
        ))}
      </div>
    </div>
  )
}
