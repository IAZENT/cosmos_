import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { ResourceForm } from '../../ResourceForm'
import {
  updateResourceAction,
  type ResourceFormState,
} from '@/app/admin/content-actions'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { ResourceRow } from '@/types/supabase'

export const dynamic = 'force-dynamic'

async function getResource(id: string): Promise<ResourceRow | null> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('resources')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    return (data as ResourceRow | null) ?? null
  } catch {
    return null
  }
}

export default async function EditResourcePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const item = await getResource(id)
  if (!item) notFound()

  const action = updateResourceAction.bind(null, item.id) as (
    prev: ResourceFormState,
    form: FormData,
  ) => Promise<ResourceFormState>

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 md:px-12">
      <Link
        href="/admin/resources"
        className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--cosmos-text-muted)] hover:text-[var(--cosmos-text)]"
      >
        <ChevronLeft size={12} aria-hidden /> Back to resources
      </Link>
      <SectionLabel className="mt-6">admin · edit resource</SectionLabel>
      <h1 className="text-[32px] leading-[1.1] tracking-[-0.01em] text-[var(--cosmos-text)]">
        {item.title}
      </h1>
      <div className="mt-8 rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-6">
        <ResourceForm action={action} initial={item} submitLabel="Save changes" />
      </div>
    </div>
  )
}
