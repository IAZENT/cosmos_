import { cn } from '@/lib/utils/cn'

export function SectionLabel({
  children,
  className,
}: {
  children: string
  className?: string
}) {
  return (
    <p
      className={cn(
        'mb-4 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--cosmos-code)]',
        className,
      )}
    >
      {'// '}
      {children}
    </p>
  )
}
