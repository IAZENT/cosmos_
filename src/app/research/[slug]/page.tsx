import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { IntelStatusBar } from '@/components/home/IntelStatusBar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { Markdown } from '@/components/research/Markdown'
import { getResearchBySlug } from '@/lib/content/server-data'
import { formatUTC } from '@/lib/utils/date'

export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getResearchBySlug(slug)
  if (!post) return { title: 'Not found', robots: { index: false } }
  const meta: Metadata = { title: post.title }
  if (post.summary) meta.description = post.summary
  return meta
}

export default async function ResearchDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getResearchBySlug(slug)
  if (!post) notFound()

  return (
    <>
      <IntelStatusBar />
      <Navbar />
      <main>
        <article className="px-4 pb-16 pt-8 sm:px-6 sm:pb-24 sm:pt-12 md:px-12 md:pt-16">
          <div className="cosmos-container max-w-3xl">
            <Link
              href="/research"
              className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--cosmos-text-muted)] hover:text-[var(--cosmos-text)]"
            >
              <ChevronLeft size={12} aria-hidden /> All research
            </Link>

            <SectionLabel className="mt-8">
              {(post.category ?? 'research').toLowerCase()}
            </SectionLabel>
            <h1 className="text-[32px] leading-[1.05] tracking-[-0.02em] text-[var(--cosmos-text)] sm:text-[40px] md:text-[52px]">
              {post.title}
            </h1>
            {post.summary ? (
              <p className="mt-4 text-[17px] leading-relaxed text-[var(--cosmos-text-muted)]">
                {post.summary}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-3 font-mono text-[11px] text-[var(--cosmos-text-dim)]">
              <span>{formatUTC(post.published_at ?? post.created_at)}</span>
              {post.mitre_techniques.length > 0 ? (
                <>
                  <span aria-hidden>·</span>
                  <span className="flex flex-wrap gap-1.5">
                    {post.mitre_techniques.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-[var(--cosmos-accent-dim)] px-2 py-[2px] uppercase tracking-[0.1em] text-[var(--cosmos-accent)]"
                      >
                        {t}
                      </span>
                    ))}
                  </span>
                </>
              ) : null}
              {post.tags.length > 0 ? (
                <>
                  <span aria-hidden>·</span>
                  <span className="flex flex-wrap gap-1.5">
                    {post.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-[var(--cosmos-border)] px-2 py-[2px] uppercase tracking-[0.1em] text-[var(--cosmos-text-muted)]"
                      >
                        {t}
                      </span>
                    ))}
                  </span>
                </>
              ) : null}
            </div>

            <div className="mt-10 border-t border-[var(--cosmos-border-dim)] pt-8">
              {post.content ? (
                <Markdown source={post.content} />
              ) : (
                <p className="text-[14px] italic text-[var(--cosmos-text-dim)]">
                  This post has no body yet.
                </p>
              )}
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}
