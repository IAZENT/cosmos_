import { cn } from '@/lib/utils/cn'
import type { ReactNode } from 'react'

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-3 rounded-[6px] border border-dashed px-6 py-10',
        'border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)]/50',
        className,
      )}
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--cosmos-code)]">
        {'// '} no data
      </p>
      <h3 className="text-lg text-[var(--cosmos-text)]">{title}</h3>
      {description ? (
        <p className="max-w-prose text-sm text-[var(--cosmos-text-muted)]">
          {description}
        </p>
      ) : null}
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  )
}
