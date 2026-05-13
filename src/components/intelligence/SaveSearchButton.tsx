'use client'

import { Bell, Check, Loader2, Mail, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { describeFilters, type SavedSearchFilters } from '@/types/saved-search'

interface SaveSearchButtonProps {
  filters: SavedSearchFilters
}

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string }

export function SaveSearchButton({ filters }: SaveSearchButtonProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [label, setLabel] = useState('')
  const [state, setState] = useState<SubmitState>({ kind: 'idle' })

  // Close on Escape and lock body scroll while the modal is open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  const summary = describeFilters(filters)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (state.kind === 'submitting') return
    setState({ kind: 'submitting' })
    try {
      const res = await fetch('/api/intelligence/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, label, filters }),
      })
      const json = (await res.json().catch(() => ({}))) as {
        error?: string
        message?: string
        status?: string
      }
      if (!res.ok) {
        setState({
          kind: 'error',
          message: json.error ?? `Request failed (${res.status})`,
        })
        return
      }
      setState({
        kind: 'success',
        message:
          json.message ??
          'Check your inbox to confirm the subscription.',
      })
    } catch (err) {
      setState({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Network error',
      })
    }
  }

  const reset = () => {
    setState({ kind: 'idle' })
    setEmail('')
    setLabel('')
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-[4px] border border-[var(--cosmos-border)] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--cosmos-text-muted)] transition-colors hover:border-[var(--cosmos-accent)] hover:text-[var(--cosmos-text)]"
        aria-label="Save this search as a weekly email digest"
      >
        <Bell size={12} aria-hidden />
        save search
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="save-search-title"
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 md:items-center"
          onClick={() => {
            setOpen(false)
            reset()
          }}
        >
          <div
            className="relative mx-auto w-full max-w-md rounded-[8px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-code)]">
                  {'// weekly digest'}
                </p>
                <h2
                  id="save-search-title"
                  className="mt-1 text-[18px] text-[var(--cosmos-text)]"
                >
                  Email me new CVEs matching this search
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  reset()
                }}
                aria-label="Close"
                className="rounded-[4px] border border-[var(--cosmos-border)] p-1.5 text-[var(--cosmos-text-muted)] hover:border-[var(--cosmos-text-dim)] hover:text-[var(--cosmos-text)]"
              >
                <X size={14} />
              </button>
            </div>

            <div className="mt-4 rounded-[4px] border border-[var(--cosmos-border-dim)] bg-[var(--cosmos-bg-subtle)] p-3 font-mono text-[11px] text-[var(--cosmos-text-muted)]">
              {summary}
            </div>

            {state.kind === 'success' ? (
              <div className="mt-4 flex items-start gap-2 rounded-[4px] border border-[var(--cosmos-accent)]/50 bg-[var(--cosmos-bg-subtle)] p-3 text-[13px] text-[var(--cosmos-text)]">
                <Check
                  size={14}
                  aria-hidden
                  className="mt-0.5 flex-shrink-0 text-[var(--cosmos-accent)]"
                />
                <span>{state.message}</span>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
                <label className="flex flex-col gap-1">
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
                    Email
                  </span>
                  <div className="flex items-center gap-2 rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] px-2.5 py-2">
                    <Mail
                      size={12}
                      className="text-[var(--cosmos-text-dim)]"
                      aria-hidden
                    />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-transparent font-mono text-[13px] text-[var(--cosmos-text)] placeholder:text-[var(--cosmos-text-dim)] focus:outline-none"
                    />
                  </div>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
                    Label (optional)
                  </span>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    maxLength={80}
                    placeholder='e.g. "Critical KEV alerts"'
                    className="rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] px-2.5 py-2 font-mono text-[13px] text-[var(--cosmos-text)] placeholder:text-[var(--cosmos-text-dim)] focus:outline-none"
                  />
                </label>

                {state.kind === 'error' ? (
                  <p className="font-mono text-[11px] text-[var(--cosmos-critical)]">
                    {state.message}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={state.kind === 'submitting'}
                  className="cosmos-btn-primary mt-1 justify-center disabled:opacity-60"
                >
                  {state.kind === 'submitting' ? (
                    <>
                      <Loader2 size={12} aria-hidden className="animate-spin" />
                      Sending verification…
                    </>
                  ) : (
                    <>
                      <Bell size={12} aria-hidden />
                      Send verification email
                    </>
                  )}
                </button>
                <p className="font-mono text-[10px] text-[var(--cosmos-text-dim)]">
                  We&apos;ll send a confirmation link. No account needed.
                  Unsubscribe anytime from any digest.
                </p>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  )
}
