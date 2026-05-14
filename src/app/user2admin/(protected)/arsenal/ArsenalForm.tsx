'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { AlertCircle } from 'lucide-react'
import {
  ARSENAL_CATEGORIES,
  ARSENAL_DIFFICULTIES,
  ARSENAL_PLATFORMS,
  ARSENAL_USE_CASES,
  CATEGORY_LABEL,
} from '@/lib/arsenal/constants'
import type { ArsenalFormState } from '@/app/user2admin/arsenal/actions'

export interface ArsenalFormInitial {
  title?: string
  command?: string
  description?: string | null
  category?: string
  subcategory?: string | null
  tags?: string[]
  platform?: string[]
  difficulty?: string
  mitre_id?: string | null
  mitre_name?: string | null
  note?: string | null
  source_url?: string | null
  use_case?: string
  published?: boolean
  pinned?: boolean
}

interface Props {
  action: (prev: ArsenalFormState, form: FormData) => Promise<ArsenalFormState>
  initial?: ArsenalFormInitial
  submitLabel: string
}

const INITIAL: ArsenalFormState = { error: null }

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

export function ArsenalForm({ action, initial, submitLabel }: Props) {
  const [state, formAction] = useActionState(action, INITIAL)
  const platforms = new Set(initial?.platform ?? [])
  const tags = (initial?.tags ?? []).join(', ')

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field
        label="Title"
        name="title"
        required
        defaultValue={initial?.title ?? ''}
      />
      <Textarea
        label="Command"
        name="command"
        rows={6}
        required
        defaultValue={initial?.command ?? ''}
        hint="The exact command, payload, or technique. Newlines are preserved."
      />
      <Textarea
        label="Description"
        name="description"
        rows={2}
        defaultValue={initial?.description ?? ''}
        hint="What it does, in plain English. 1–2 sentences."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SelectField
          label="Category"
          name="category"
          required
          defaultValue={initial?.category ?? 'misc'}
          options={ARSENAL_CATEGORIES.map((c) => ({
            value: c,
            label: CATEGORY_LABEL[c],
          }))}
        />
        <Field
          label="Subcategory"
          name="subcategory"
          defaultValue={initial?.subcategory ?? ''}
          hint="Optional finer grouping (free text)."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SelectField
          label="Difficulty"
          name="difficulty"
          required
          defaultValue={initial?.difficulty ?? 'intermediate'}
          options={ARSENAL_DIFFICULTIES.map((d) => ({ value: d, label: d }))}
        />
        <SelectField
          label="Use case"
          name="use_case"
          required
          defaultValue={initial?.use_case ?? 'both'}
          options={ARSENAL_USE_CASES.map((d) => ({ value: d, label: d }))}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
          Platform
        </span>
        <div className="flex flex-wrap gap-3 rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] px-3 py-2">
          {ARSENAL_PLATFORMS.map((p) => (
            <label
              key={p}
              className="inline-flex items-center gap-2 font-mono text-[12px] text-[var(--cosmos-text)]"
            >
              <input
                type="checkbox"
                name="platform"
                value={p}
                defaultChecked={platforms.has(p)}
                className="h-3 w-3 accent-[var(--cosmos-accent)]"
              />
              {p}
            </label>
          ))}
        </div>
      </div>

      <Field
        label="Tags"
        name="tags"
        defaultValue={tags}
        hint="Comma-separated. e.g. nmap, recon, tcp"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[160px_minmax(0,1fr)]">
        <Field
          label="MITRE ID"
          name="mitre_id"
          defaultValue={initial?.mitre_id ?? ''}
          hint="e.g. T1046"
        />
        <Field
          label="MITRE name"
          name="mitre_name"
          defaultValue={initial?.mitre_name ?? ''}
          hint="e.g. Network Service Discovery"
        />
      </div>

      <Textarea
        label="Note (↳ field)"
        name="note"
        rows={3}
        defaultValue={initial?.note ?? ''}
        hint="Personal context, gotchas, or variations."
      />

      <Field
        label="Source URL"
        name="source_url"
        defaultValue={initial?.source_url ?? ''}
        hint="Optional reference link."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Toggle
          name="published"
          label="Published"
          help="Visible on /arsenal"
          defaultChecked={initial?.published ?? true}
        />
        <Toggle
          name="pinned"
          label="Pinned"
          help="Show at the top of /arsenal"
          defaultChecked={initial?.pinned ?? false}
        />
      </div>

      {state.error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-[4px] border border-[var(--cosmos-critical)]/40 bg-[var(--cosmos-critical)]/10 px-3 py-2 font-mono text-[11px] text-[var(--cosmos-critical)]"
        >
          <AlertCircle size={12} aria-hidden className="mt-0.5" /> {state.error}
        </p>
      ) : null}

      <div className="flex justify-end">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  )
}

function Field({
  label,
  name,
  required,
  defaultValue,
  hint,
}: {
  label: string
  name: string
  required?: boolean
  defaultValue?: string
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={`arsenal-${name}`}
        className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]"
      >
        {label}
        {required ? <span className="text-[var(--cosmos-critical)]"> *</span> : null}
      </label>
      <input
        id={`arsenal-${name}`}
        type="text"
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
  required,
  defaultValue,
  hint,
}: {
  label: string
  name: string
  rows: number
  required?: boolean
  defaultValue?: string
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={`arsenal-${name}`}
        className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]"
      >
        {label}
        {required ? <span className="text-[var(--cosmos-critical)]"> *</span> : null}
      </label>
      <textarea
        id={`arsenal-${name}`}
        name={name}
        rows={rows}
        required={required}
        defaultValue={defaultValue}
        className="rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] px-3 py-2 font-mono text-[12px] leading-relaxed text-[var(--cosmos-text)]"
      />
      {hint ? (
        <p className="font-mono text-[10px] text-[var(--cosmos-text-dim)]">{hint}</p>
      ) : null}
    </div>
  )
}

function SelectField({
  label,
  name,
  required,
  defaultValue,
  options,
}: {
  label: string
  name: string
  required?: boolean
  defaultValue?: string
  options: { value: string; label: string }[]
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={`arsenal-${name}`}
        className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]"
      >
        {label}
        {required ? <span className="text-[var(--cosmos-critical)]"> *</span> : null}
      </label>
      <select
        id={`arsenal-${name}`}
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] px-3 py-2 font-mono text-[12px] text-[var(--cosmos-text)]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function Toggle({
  name,
  label,
  help,
  defaultChecked,
}: {
  name: string
  label: string
  help: string
  defaultChecked: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
        {label}
      </span>
      <label className="flex items-center gap-2 rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] px-3 py-2">
        <input
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          className="h-3 w-3 accent-[var(--cosmos-accent)]"
        />
        <span className="font-mono text-[12px] text-[var(--cosmos-text)]">
          {help}
        </span>
      </label>
    </div>
  )
}
