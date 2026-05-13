import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { ResourceForm } from '../ResourceForm'
import { createResourceAction } from '@/app/user2admin/content-actions'

export const dynamic = 'force-dynamic'

export default function NewResourcePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 md:px-12">
      <Link
        href="/user2admin/resources"
        className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--cosmos-text-muted)] hover:text-[var(--cosmos-text)]"
      >
        <ChevronLeft size={12} aria-hidden /> Back to resources
      </Link>
      <SectionLabel className="mt-6">admin · new resource</SectionLabel>
      <h1 className="text-[32px] leading-[1.1] tracking-[-0.01em] text-[var(--cosmos-text)]">
        Add a resource
      </h1>
      <p className="mt-2 text-[13px] leading-relaxed text-[var(--cosmos-text-muted)]">
        Publish a curated external link. Entries with the published switch
        enabled appear immediately on <code className="font-mono">/resources</code>.
      </p>
      <div className="mt-8 rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-6">
        <ResourceForm action={createResourceAction} submitLabel="Create resource" />
      </div>
    </div>
  )
}
