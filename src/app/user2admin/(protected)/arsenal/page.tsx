import Link from 'next/link'
import { Plus } from 'lucide-react'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { listArsenalAdmin } from '@/lib/arsenal/server-data'
import { CATEGORY_LABEL } from '@/lib/arsenal/constants'
import { formatUTC } from '@/lib/utils/date'
import {
  DeleteArsenalForm,
  TogglePinForm,
  TogglePublishForm,
} from './RowActions'

export const dynamic = 'force-dynamic'

export default async function AdminArsenalPage() {
  const items = await listArsenalAdmin()
  return (
    <div className="mx-auto max-w-cosmos px-6 py-12 md:px-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionLabel>admin · arsenal</SectionLabel>
          <h1 className="text-[32px] leading-[1.1] tracking-[-0.01em] text-[var(--cosmos-text)] md:text-[40px]">
            Arsenal entries
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-[var(--cosmos-text-muted)]">
            Operator commands, techniques, and playbooks. Published entries
            appear at{' '}
            <code className="mx-1 rounded bg-[var(--cosmos-bg-subtle)] px-1 font-mono text-[11px]">
              /arsenal
            </code>
            .
          </p>
        </div>
        <Link href="/user2admin/arsenal/new" className="cosmos-btn-primary">
          <Plus size={12} aria-hidden /> New entry
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="mt-10 rounded-[6px] border border-dashed border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)]/50 px-6 py-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--cosmos-code)]">
            {'// no data'}
          </p>
          <p className="mt-2 text-[14px] text-[var(--cosmos-text)]">
            No arsenal entries yet. Apply migration{' '}
            <code className="font-mono">0008_arsenal.sql</code> to seed the
            curated set, or add one manually.
          </p>
        </div>
      ) : (
        <div className="mt-10 overflow-x-auto rounded-[6px] border border-[var(--cosmos-border)]">
          <table className="w-full min-w-[860px] text-left font-mono text-[12px]">
            <thead className="bg-[var(--cosmos-bg-elevated)] text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
              <tr>
                <th className="px-3 py-2 font-normal">Title</th>
                <th className="px-3 py-2 font-normal">Category</th>
                <th className="px-3 py-2 font-normal">Difficulty</th>
                <th className="px-3 py-2 font-normal">Status</th>
                <th className="px-3 py-2 font-normal">Copies</th>
                <th className="px-3 py-2 font-normal">Updated</th>
                <th className="px-3 py-2 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((e) => (
                <tr
                  key={e.id}
                  className="border-t border-[var(--cosmos-border-dim)]"
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {e.pinned ? (
                        <span className="font-mono text-[10px] uppercase text-[var(--cosmos-accent)]">
                          ●
                        </span>
                      ) : null}
                      <span className="text-[var(--cosmos-text)]">{e.title}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-[var(--cosmos-text-muted)]">
                    {CATEGORY_LABEL[e.category] ?? e.category}
                  </td>
                  <td className="px-3 py-2 text-[var(--cosmos-text-muted)]">
                    {e.difficulty}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        e.published
                          ? 'text-[var(--cosmos-low)]'
                          : 'text-[var(--cosmos-text-dim)]'
                      }
                    >
                      {e.published ? 'published' : 'draft'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[var(--cosmos-text-dim)]">
                    {e.usage_count.toLocaleString('en-US')}
                  </td>
                  <td className="px-3 py-2 text-[var(--cosmos-text-dim)]">
                    {formatUTC(e.updated_at)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex items-center gap-3 whitespace-nowrap">
                      <TogglePinForm id={e.id} current={e.pinned} />
                      <TogglePublishForm id={e.id} current={e.published} />
                      <Link
                        href={`/user2admin/arsenal/${e.id}/edit`}
                        className="text-[var(--cosmos-accent)] hover:underline"
                      >
                        Edit
                      </Link>
                      <DeleteArsenalForm id={e.id} />
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
