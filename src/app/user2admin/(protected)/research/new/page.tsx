import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { ResearchForm } from '../ResearchForm'
import { createResearchAction } from '@/app/user2admin/content-actions'

export const dynamic = 'force-dynamic'

export default function NewResearchPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 md:px-12">
      <Link
        href="/user2admin/research"
        className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--cosmos-text-muted)] hover:text-[var(--cosmos-text)]"
      >
        <ChevronLeft size={12} aria-hidden /> Back to research
      </Link>
      <SectionLabel className="mt-6">admin · new post</SectionLabel>
      <h1 className="text-[32px] leading-[1.1] tracking-[-0.01em] text-[var(--cosmos-text)]">
        Draft a research post
      </h1>
      <div className="mt-8 rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-6">
        <ResearchForm action={createResearchAction} submitLabel="Create post" />
      </div>
    </div>
  )
}
