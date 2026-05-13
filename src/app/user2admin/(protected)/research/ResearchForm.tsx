'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { AlertCircle } from 'lucide-react'
import { MarkdownEditor } from '@/components/research/MarkdownEditor'
import { RESEARCH_CATEGORIES } from '@/lib/content/categories'
import type { ResearchPostRow } from '@/types/supabase'
import type { PostFormState } from '@/app/user2admin/content-actions'

interface Props {
  action: (prev: PostFormState, form: FormData) => Promise<PostFormState>
  initial?: Partial<ResearchPostRow>
  submitLabel: string
}

const INITIAL: PostFormState = { error: null }

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

export function ResearchForm({ action, initial, submitLabel }: Props) {
  const [state, formAction] = useActionState(action, INITIAL)
  const tags = (initial?.tags ?? []).join(', ')
  const mitre = (initial?.mitre_techniques ?? []).join(', ')

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Field
          label="Title"
          name="title"
          required
          defaultValue={initial?.title ?? ''}
        />
        <Field
          label="Slug"
          name="slug"
          required
          defaultValue={initial?.slug ?? ''}
          hint="lowercase, kebab-case  appears in the URL /research/{slug}"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_160px]">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="post-category"
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]"
          >
            Category
          </label>
          <select
            id="post-category"
            name="category"
            defaultValue={initial?.category ?? ''}
            className="rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] px-3 py-2 font-mono text-[12px] text-[var(--cosmos-text)]"
          >
            <option value=""></option>
            {RESEARCH_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
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
              defaultChecked={initial?.published ?? false}
              className="h-3 w-3 accent-[var(--cosmos-accent)]"
            />
            <span className="font-mono text-[12px] text-[var(--cosmos-text)]">
              Visible on /research
            </span>
          </label>
        </div>
      </div>
      <Textarea
        label="Summary"
        name="summary"
        rows={2}
        defaultValue={initial?.summary ?? ''}
        hint="Short hook shown on the listing card. 1–2 sentences."
      />
      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
          Content (Markdown)
        </label>
        <MarkdownEditor name="content" defaultValue={initial?.content ?? ''} rows={20} />
        <p className="font-mono text-[10px] text-[var(--cosmos-text-dim)]">
          GFM markdown: headings, code fences, tables, links. Code blocks render
          with syntax highlighting on the published page.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field
          label="Tags"
          name="tags"
          defaultValue={tags}
          hint="Comma-separated. e.g. yara, loader, dropper"
        />
        <Field
          label="MITRE ATT&CK techniques"
          name="mitre_techniques"
          defaultValue={mitre}
          hint="Comma-separated. e.g. T1059, T1547, T1071.001"
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
        htmlFor={`post-${name}`}
        className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]"
      >
        {label}
        {required ? <span className="text-[var(--cosmos-critical)]"> *</span> : null}
      </label>
      <input
        id={`post-${name}`}
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
  defaultValue,
  hint,
  mono,
}: {
  label: string
  name: string
  rows: number
  defaultValue?: string
  hint?: string
  mono?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={`post-${name}`}
        className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]"
      >
        {label}
      </label>
      <textarea
        id={`post-${name}`}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        className={
          mono
            ? 'rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] px-3 py-2 font-mono text-[12px] leading-relaxed text-[var(--cosmos-text)]'
            : 'rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] px-3 py-2 font-mono text-[12px] leading-relaxed text-[var(--cosmos-text)]'
        }
      />
      {hint ? (
        <p className="font-mono text-[10px] text-[var(--cosmos-text-dim)]">{hint}</p>
      ) : null}
    </div>
  )
}
