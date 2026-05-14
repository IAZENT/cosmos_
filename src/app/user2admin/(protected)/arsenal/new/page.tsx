import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { ArsenalForm } from '../ArsenalForm'
import { createArsenalAction } from '@/app/user2admin/arsenal/actions'
import {
  isCategory,
  isDifficulty,
  isPlatform,
  isUseCase,
} from '@/lib/arsenal/constants'

export const dynamic = 'force-dynamic'

export default async function NewArsenalPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  // Pre-fill via querystring (used by the AI fallback "Add to ARSENAL" CTA).
  const sp = await searchParams
  const pick = (k: string): string => {
    const v = sp[k]
    if (typeof v === 'string') return v
    if (Array.isArray(v)) return v[0] ?? ''
    return ''
  }
  const tagList = pick('tags')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
  const platformParam = pick('platform')
  const platforms = platformParam
    .split(',')
    .map((t) => t.trim())
    .filter((t) => isPlatform(t))

  const initial = {
    title: pick('title'),
    command: pick('command'),
    description: pick('description'),
    category: isCategory(pick('category')) ? pick('category') : 'misc',
    tags: tagList,
    platform: platforms.length > 0 ? platforms : ['linux'],
    difficulty: isDifficulty(pick('difficulty'))
      ? pick('difficulty')
      : 'intermediate',
    use_case: isUseCase(pick('use_case')) ? pick('use_case') : 'both',
    note: pick('note'),
    published: true,
    pinned: false,
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 md:px-12">
      <Link
        href="/user2admin/arsenal"
        className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--cosmos-text-muted)] hover:text-[var(--cosmos-text)]"
      >
        <ChevronLeft size={12} aria-hidden /> Back to arsenal
      </Link>
      <SectionLabel className="mt-6">admin · new entry</SectionLabel>
      <h1 className="text-[32px] leading-[1.1] tracking-[-0.01em] text-[var(--cosmos-text)]">
        New arsenal entry
      </h1>
      <div className="mt-8 rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-6">
        <ArsenalForm
          action={createArsenalAction}
          initial={initial}
          submitLabel="Create entry"
        />
      </div>
    </div>
  )
}
