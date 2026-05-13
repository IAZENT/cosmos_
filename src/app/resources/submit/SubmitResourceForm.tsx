'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { RESOURCE_CATEGORIES } from '@/lib/content/categories'
import {
  submitResourceAction,
  type PublicSubmitState,
} from '@/app/admin/content-actions'

const INITIAL: PublicSubmitState = { error: null }

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="cosmos-btn-primary disabled:opacity-60"
    >
      {pending ? 'Submitting…' : '→ Submit for review'}
    </button>
  )
}

export function SubmitResourceForm() {
  const [state, formAction] = useActionState(submitResourceAction, INITIAL)

  if (state.ok) {
    return (
      <div className="rounded-[6px] border border-[var(--cosmos-low)]/40 bg-[var(--cosmos-low)]/10 p-6">
        <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--cosmos-low)]">
          <CheckCircle2 size={14} aria-hidden /> {'// submitted'}
        </p>
        <h2 className="mt-3 text-[20px] text-[var(--cosmos-text)]">
          Thanks  your submission is queued for review.
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--cosmos-text-muted)]">
          An administrator will evaluate the link and publish it if it fits the
          directory. Submissions remain unpublished in the meantime.
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {/* Honeypot  hidden from real users, bots fill it and we drop silently */}
      <div className="hidden" aria-hidden>
        <label htmlFor="hp-website">Website</label>
        <input id="hp-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field name="title" label="Title" required />
        <Field name="url" label="URL" type="url" required />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="submit-category"
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]"
          >
            Category
          </label>
          <select
            id="submit-category"
            name="category"
            className="rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] px-3 py-2 font-mono text-[12px] text-[var(--cosmos-text)]"
            defaultValue=""
          >
            <option value=""></option>
            {RESOURCE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <Field
          name="tags"
          label="Tags"
          hint="Comma-separated, max 10. e.g. nmap, recon"
        />
      </div>
      <Textarea
        name="description"
        label="Short description"
        rows={3}
        hint="One or two sentences about what this resource is."
      />
      <Textarea
        name="submitter_note"
        label="Note to reviewer (optional)"
        rows={2}
        hint="Why is this worth adding? Max 500 characters."
      />

      {state.error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-[4px] border border-[var(--cosmos-critical)]/40 bg-[var(--cosmos-critical)]/10 px-3 py-2 font-mono text-[11px] text-[var(--cosmos-critical)]"
        >
          <AlertCircle size={12} aria-hidden className="mt-0.5" /> {state.error}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Submit />
      </div>
    </form>
  )
}

function Field({
  name,
  label,
  required,
  type = 'text',
  hint,
}: {
  name: string
  label: string
  required?: boolean
  type?: string
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={`submit-${name}`}
        className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]"
      >
        {label}
        {required ? <span className="text-[var(--cosmos-critical)]"> *</span> : null}
      </label>
      <input
        id={`submit-${name}`}
        name={name}
        type={type}
        required={required}
        className="rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] px-3 py-2 font-mono text-[12px] text-[var(--cosmos-text)]"
      />
      {hint ? (
        <p className="font-mono text-[10px] text-[var(--cosmos-text-dim)]">{hint}</p>
      ) : null}
    </div>
  )
}

function Textarea({
  name,
  label,
  rows,
  hint,
}: {
  name: string
  label: string
  rows: number
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={`submit-${name}`}
        className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]"
      >
        {label}
      </label>
      <textarea
        id={`submit-${name}`}
        name={name}
        rows={rows}
        className="rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] px-3 py-2 font-mono text-[12px] leading-relaxed text-[var(--cosmos-text)]"
      />
      {hint ? (
        <p className="font-mono text-[10px] text-[var(--cosmos-text-dim)]">{hint}</p>
      ) : null}
    </div>
  )
}
