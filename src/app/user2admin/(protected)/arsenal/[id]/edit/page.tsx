import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { ArsenalForm } from '../../ArsenalForm'
import {
  updateArsenalAction,
  type ArsenalFormState,
} from '@/app/user2admin/arsenal/actions'
import { getArsenalEntry } from '@/lib/arsenal/server-data'

export const dynamic = 'force-dynamic'

export default async function EditArsenalPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const entry = await getArsenalEntry(id)
  if (!entry) notFound()

  const action = updateArsenalAction.bind(null, entry.id) as (
    prev: ArsenalFormState,
    form: FormData,
  ) => Promise<ArsenalFormState>

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 md:px-12">
      <Link
        href="/user2admin/arsenal"
        className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--cosmos-text-muted)] hover:text-[var(--cosmos-text)]"
      >
        <ChevronLeft size={12} aria-hidden /> Back to arsenal
      </Link>
      <SectionLabel className="mt-6">admin · edit entry</SectionLabel>
      <h1 className="text-[32px] leading-[1.1] tracking-[-0.01em] text-[var(--cosmos-text)]">
        {entry.title}
      </h1>
      <div className="mt-8 rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-6">
        <ArsenalForm
          action={action}
          initial={entry}
          submitLabel="Save changes"
        />
      </div>
    </div>
  )
}
