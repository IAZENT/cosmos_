'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

/**
 * Numbered pagination control. Renders Prev / 1 / 2 / … / N / Next.
 *
 * `page` is 1-indexed for human-friendly URLs and labels. The component
 * is purely presentational  the parent owns state and passes a new
 * page number to `onChange`.
 *
 * Sliding window logic ("1 … 4 5 6 … 99") keeps the control compact on
 * mobile while still letting users jump to first/last in one click.
 */
export function Pagination({
  page,
  totalPages,
  onChange,
  disabled = false,
  className,
}: {
  page: number
  totalPages: number
  onChange: (next: number) => void
  disabled?: boolean
  className?: string
}) {
  if (totalPages <= 1) return null

  const goto = (n: number) => {
    if (disabled) return
    const clamped = Math.max(1, Math.min(totalPages, n))
    if (clamped !== page) onChange(clamped)
  }

  const items = computeItems(page, totalPages)

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        'flex flex-wrap items-center justify-center gap-1.5 pt-4',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => goto(page - 1)}
        disabled={disabled || page <= 1}
        aria-label="Previous page"
        className={btnCls(false)}
      >
        <ChevronLeft size={12} aria-hidden />
        <span className="hidden sm:inline">prev</span>
      </button>

      {items.map((item, i) =>
        item === 'gap' ? (
          <span
            key={`gap-${i}`}
            aria-hidden
            className="px-1 font-mono text-[11px] text-[var(--cosmos-text-dim)]"
          >
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => goto(item)}
            disabled={disabled}
            aria-current={item === page ? 'page' : undefined}
            aria-label={`Page ${item}`}
            className={btnCls(item === page)}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => goto(page + 1)}
        disabled={disabled || page >= totalPages}
        aria-label="Next page"
        className={btnCls(false)}
      >
        <span className="hidden sm:inline">next</span>
        <ChevronRight size={12} aria-hidden />
      </button>
    </nav>
  )
}

function btnCls(active: boolean): string {
  return cn(
    'inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-[4px] border px-2.5 font-mono text-[11px] uppercase tracking-[0.06em] transition-colors',
    'disabled:cursor-not-allowed disabled:opacity-40',
    active
      ? 'border-[var(--cosmos-accent)] bg-[var(--cosmos-accent-dim)] text-[var(--cosmos-accent)]'
      : 'border-[var(--cosmos-border)] text-[var(--cosmos-text-muted)] hover:border-[var(--cosmos-text-dim)] hover:text-[var(--cosmos-text)]',
  )
}

/**
 * Build the visible page-number sequence with `'gap'` markers for
 * elided ranges. Always shows first + last; otherwise a 5-wide window
 * around the current page.
 *
 * Examples (current bolded):
 *   total=4,  page=2 → 1 *2* 3 4
 *   total=20, page=1 → *1* 2 3 4 5 … 20
 *   total=20, page=10 → 1 … 9 *10* 11 … 20
 *   total=20, page=20 → 1 … 16 17 18 19 *20*
 */
function computeItems(
  page: number,
  totalPages: number,
): Array<number | 'gap'> {
  const out: Array<number | 'gap'> = []
  const window = 1 // pages on each side of current
  const lo = Math.max(2, page - window)
  const hi = Math.min(totalPages - 1, page + window)

  out.push(1)
  if (lo > 2) out.push('gap')
  for (let i = lo; i <= hi; i += 1) out.push(i)
  if (hi < totalPages - 1) out.push('gap')
  if (totalPages > 1) out.push(totalPages)

  return out
}
