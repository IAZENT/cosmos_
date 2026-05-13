import Link from 'next/link'
import { Plus } from 'lucide-react'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { listAllResearch } from '@/lib/content/server-data'
import { formatUTC } from '@/lib/utils/date'
import { DeleteResearchForm } from './DeleteResearchForm'

export const dynamic = 'force-dynamic'

export default async function AdminResearchPage() {
  const items = await listAllResearch()
  return (
    <div className="mx-auto max-w-cosmos px-6 py-12 md:px-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionLabel>admin · research</SectionLabel>
          <h1 className="text-[32px] leading-[1.1] tracking-[-0.01em] text-[var(--cosmos-text)] md:text-[40px]">
            Research posts
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-[var(--cosmos-text-muted)]">
            Markdown writeups. Published posts appear at
            <code className="mx-1 rounded bg-[var(--cosmos-bg-subtle)] px-1 font-mono text-[11px]">
              /research
            </code>
            and <code className="font-mono">/research/[slug]</code>.
          </p>
        </div>
        <Link href="/user2admin/research/new" className="cosmos-btn-primary">
          <Plus size={12} aria-hidden /> New post
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="mt-10 rounded-[6px] border border-dashed border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)]/50 px-6 py-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--cosmos-code)]">
            {'// no data'}
          </p>
          <p className="mt-2 text-[14px] text-[var(--cosmos-text)]">
            No posts yet.
          </p>
        </div>
      ) : (
        <div className="mt-10 overflow-hidden rounded-[6px] border border-[var(--cosmos-border)]">
          <table className="w-full text-left font-mono text-[12px]">
            <thead className="bg-[var(--cosmos-bg-elevated)] text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
              <tr>
                <th className="px-3 py-2 font-normal">Title</th>
                <th className="px-3 py-2 font-normal">Category</th>
                <th className="px-3 py-2 font-normal">Status</th>
                <th className="px-3 py-2 font-normal">Published</th>
                <th className="px-3 py-2 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-t border-[var(--cosmos-border-dim)]">
                  <td className="px-3 py-2">
                    <div className="flex flex-col">
                      <span className="text-[var(--cosmos-text)]">{p.title}</span>
                      <span className="truncate text-[10px] text-[var(--cosmos-text-dim)]">
                        /{p.slug}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-[var(--cosmos-text-muted)]">
                    {p.category ?? ''}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        p.published
                          ? 'text-[var(--cosmos-low)]'
                          : 'text-[var(--cosmos-text-dim)]'
                      }
                    >
                      {p.published ? 'published' : 'draft'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[var(--cosmos-text-dim)]">
                    {p.published_at ? formatUTC(p.published_at) : ''}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex items-center gap-3">
                      {p.published ? (
                        <Link
                          href={`/research/${p.slug}`}
                          target="_blank"
                          className="text-[var(--cosmos-accent)] hover:underline"
                        >
                          View
                        </Link>
                      ) : null}
                      <Link
                        href={`/user2admin/research/${p.id}/edit`}
                        className="text-[var(--cosmos-accent)] hover:underline"
                      >
                        Edit
                      </Link>
                      <DeleteResearchForm id={p.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
