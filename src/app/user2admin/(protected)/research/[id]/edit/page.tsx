import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { ResearchForm } from '../../ResearchForm'
import {
  updateResearchAction,
  type PostFormState,
} from '@/app/user2admin/content-actions'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { ResearchPostRow } from '@/types/supabase'

export const dynamic = 'force-dynamic'

async function getPostById(id: string): Promise<ResearchPostRow | null> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('research_posts')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    return (data as ResearchPostRow | null) ?? null
  } catch {
    return null
  }
}

export default async function EditResearchPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const post = await getPostById(id)
  if (!post) notFound()

  const action = updateResearchAction.bind(null, post.id) as (
    prev: PostFormState,
    form: FormData,
  ) => Promise<PostFormState>

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 md:px-12">
      <Link
        href="/user2admin/research"
        className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--cosmos-text-muted)] hover:text-[var(--cosmos-text)]"
      >
        <ChevronLeft size={12} aria-hidden /> Back to research
      </Link>
      <SectionLabel className="mt-6">admin · edit post</SectionLabel>
      <h1 className="text-[32px] leading-[1.1] tracking-[-0.01em] text-[var(--cosmos-text)]">
        {post.title}
      </h1>
      <div className="mt-8 rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-6">
        <ResearchForm action={action} initial={post} submitLabel="Save changes" />
      </div>
    </div>
  )
}
