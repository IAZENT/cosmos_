import Link from 'next/link'
import { AlertTriangle, Plus } from 'lucide-react'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { listAllResources } from '@/lib/content/server-data'
import { TrustRating } from '@/components/ui/TrustRating'
import { DeleteResourceForm } from './DeleteResourceForm'
import { PublishResourceForm } from './PublishResourceForm'

export const dynamic = 'force-dynamic'

export default async function AdminResourcesPage() {
  const items = await listAllResources()
  const drafts = items.filter((r) => !r.published).length

  return (
    <div className="mx-auto max-w-cosmos px-6 py-12 md:px-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionLabel>admin · resources</SectionLabel>
          <h1 className="text-[32px] leading-[1.1] tracking-[-0.01em] text-[var(--cosmos-text)] md:text-[40px]">
            Resource network
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-[var(--cosmos-text-muted)]">
            Curated tooling and reference material. Drafts originate from{' '}
            <code className="rounded bg-[var(--cosmos-bg-subtle)] px-1 font-mono text-[11px]">
              /resources/submit
            </code>{' '}
            or admin creation. Only published rows appear at{' '}
            <code className="rounded bg-[var(--cosmos-bg-subtle)] px-1 font-mono text-[11px]">
              /resources
            </code>
            .
          </p>
        </div>
        <Link href="/admin/resources/new" className="cosmos-btn-primary">
          <Plus size={12} aria-hidden /> New resource
        </Link>
      </div>

      {drafts > 0 ? (
        <div className="mt-8 flex items-center gap-3 rounded-[6px] border border-[var(--cosmos-medium)]/40 bg-[var(--cosmos-medium)]/10 px-4 py-3">
          <AlertTriangle
            size={14}
            aria-hidden
            className="text-[var(--cosmos-medium)]"
          />
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--cosmos-medium)]">
            {drafts} draft{drafts === 1 ? '' : 's'} awaiting review
          </p>
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="mt-10 rounded-[6px] border border-dashed border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)]/50 px-6 py-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--cosmos-code)]">
            {'// no data'}
          </p>
          <p className="mt-2 text-[14px] text-[var(--cosmos-text)]">
            No resources yet.
          </p>
          <p className="mt-1 text-[12px] text-[var(--cosmos-text-muted)]">
            Create one via the button above.
          </p>
        </div>
      ) : (
        <div className="mt-10 overflow-hidden rounded-[6px] border border-[var(--cosmos-border)]">
          <table className="w-full text-left font-mono text-[12px]">
            <thead className="bg-[var(--cosmos-bg-elevated)] text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
              <tr>
                <th className="px-3 py-2 font-normal">Title</th>
                <th className="px-3 py-2 font-normal">Category</th>
                <th className="px-3 py-2 font-normal">Trust</th>
                <th className="px-3 py-2 font-normal">Status</th>
                <th className="px-3 py-2 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-t border-[var(--cosmos-border-dim)]">
                  <td className="px-3 py-2">
                    <div className="flex flex-col">
                      <span className="text-[var(--cosmos-text)]">{r.title}</span>
                      <span className="truncate text-[10px] text-[var(--cosmos-text-dim)]">
                        {r.url}
                      </span>
                      {r.personal_note?.startsWith('[submitted via public form]') ? (
                        <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--cosmos-medium)]">
                          submitted via public form
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-[var(--cosmos-text-muted)]">
                    {r.category ?? ''}
                  </td>
                  <td className="px-3 py-2">
                    <TrustRating rating={r.trust_rating} />
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        r.published
                          ? 'text-[var(--cosmos-low)]'
                          : 'text-[var(--cosmos-medium)]'
                      }
                    >
                      {r.published ? 'published' : 'draft'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex items-center gap-3">
                      {r.published ? null : <PublishResourceForm id={r.id} />}
                      <Link
                        href={`/admin/resources/${r.id}/edit`}
                        className="text-[var(--cosmos-accent)] hover:underline"
                      >
                        Edit
                      </Link>
                      <DeleteResourceForm id={r.id} />
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
