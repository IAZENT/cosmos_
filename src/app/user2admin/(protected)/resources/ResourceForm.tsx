'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { AlertCircle } from 'lucide-react'
import { RESOURCE_CATEGORIES } from '@/lib/content/categories'
import type { ResourceRow } from '@/types/supabase'
import type { ResourceFormState } from '@/app/user2admin/content-actions'

interface Props {
  action: (
    prev: ResourceFormState,
    form: FormData,
  ) => Promise<ResourceFormState>
  initial?: Partial<ResourceRow>
  submitLabel: string
}

const INITIAL: ResourceFormState = { error: null }

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="cosmos-btn-primary disabled:opacity-60"
    >
      {pending ? 'Saving…' : label}
    </button>
  )
}

export function ResourceForm({ action, initial, submitLabel }: Props) {
  const [state, formAction] = useActionState(action, INITIAL)
  const tagsValue = (initial?.tags ?? []).join(', ')

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Labeled label="Title" name="title" required defaultValue={initial?.title ?? ''} />
        <Labeled label="URL" name="url" required type="url" defaultValue={initial?.url ?? ''} />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_160px_160px]">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="resource-category"
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]"
          >
            Category
          </label>
          <select
            id="resource-category"
            name="category"
            defaultValue={initial?.category ?? ''}
            className="rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] px-3 py-2 font-mono text-[12px] text-[var(--cosmos-text)]"
          >
            <option value=""></option>
            {RESOURCE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="resource-trust"
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]"
          >
            Trust rating
          </label>
          <select
            id="resource-trust"
            name="trust_rating"
            defaultValue={initial?.trust_rating?.toString() ?? ''}
            className="rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] px-3 py-2 font-mono text-[12px] text-[var(--cosmos-text)]"
          >
            <option value=""></option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} / 5
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
            Published
          </span>
          <label className="flex items-center gap-2 rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] px-3 py-2">
            <input
              type="checkbox"
              name="published"
              defaultChecked={initial?.published ?? true}
              className="h-3 w-3 accent-[var(--cosmos-accent)]"
            />
            <span className="font-mono text-[12px] text-[var(--cosmos-text)]">
              Visible on /resources
            </span>
          </label>
        </div>
      </div>
      <Textarea
        label="Description"
        name="description"
        rows={3}
        defaultValue={initial?.description ?? ''}
      />
      <Textarea
        label="Personal note"
        name="personal_note"
        rows={2}
        defaultValue={initial?.personal_note ?? ''}
        hint="Short, first-person context shown in italics on the public card."
      />
      <Labeled
        label="Tags"
        name="tags"
        defaultValue={tagsValue}
        hint="Comma-separated. e.g. nmap, recon, pentest"
      />

      {state.error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-[4px] border border-[var(--cosmos-critical)]/40 bg-[var(--cosmos-critical)]/10 px-3 py-2 font-mono text-[11px] text-[var(--cosmos-critical)]"
        >
          <AlertCircle size={12} aria-hidden className="mt-0.5" /> {state.error}
        </p>
      ) : null}

      <div className="flex justify-end gap-3">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  )
}

function Labeled({
  label,
  name,
  type = 'text',
  defaultValue,
  required,
  hint,
}: {
  label: string
  name: string
  type?: string
  defaultValue?: string
  required?: boolean
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={`resource-${name}`}
        className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]"
      >
        {label}
        {required ? <span className="text-[var(--cosmos-critical)]"> *</span> : null}
      </label>
      <input
        id={`resource-${name}`}
        type={type}
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] px-3 py-2 font-mono text-[12px] text-[var(--cosmos-text)]"
      />
      {hint ? (
        <p className="font-mono text-[10px] text-[var(--cosmos-text-dim)]">{hint}</p>
      ) : null}
    </div>
  )
}

function Textarea({
  label,
  name,
  rows,
  defaultValue,
  hint,
}: {
  label: string
  name: string
  rows: number
  defaultValue?: string
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={`resource-${name}`}
        className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]"
      >
        {label}
      </label>
      <textarea
        id={`resource-${name}`}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        className="rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] px-3 py-2 font-mono text-[12px] leading-relaxed text-[var(--cosmos-text)]"
      />
      {hint ? (
        <p className="font-mono text-[10px] text-[var(--cosmos-text-dim)]">{hint}</p>
      ) : null}
    </div>
  )
}
