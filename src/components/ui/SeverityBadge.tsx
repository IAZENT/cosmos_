import { cn } from '@/lib/utils/cn'
import type { Severity } from '@/lib/utils/severity'

const severityConfig: Record<Severity, { dot: string; text: string }> = {
  CRITICAL: {
    dot: 'bg-[var(--cosmos-critical)]',
    text: 'text-[var(--cosmos-critical)]',
  },
  HIGH: {
    dot: 'bg-[var(--cosmos-high)]',
    text: 'text-[var(--cosmos-high)]',
  },
  MEDIUM: {
    dot: 'bg-[var(--cosmos-medium)]',
    text: 'text-[var(--cosmos-medium)]',
  },
  LOW: {
    dot: 'bg-[var(--cosmos-low)]',
    text: 'text-[var(--cosmos-low)]',
  },
  INFO: {
    dot: 'bg-[var(--cosmos-info)]',
    text: 'text-[var(--cosmos-info)]',
  },
  NONE: {
    dot: 'bg-[var(--cosmos-text-dim)]',
    text: 'text-[var(--cosmos-text-dim)]',
  },
}

export function SeverityBadge({
  level,
  className,
}: {
  level: Severity
  className?: string
}) {
  const config = severityConfig[level] ?? severityConfig.NONE
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span
        className={cn('h-1.5 w-1.5 flex-shrink-0 rounded-full', config.dot)}
      />
      <span
        className={cn(
          'font-mono text-[10px] uppercase tracking-[0.1em]',
          config.text,
        )}
      >
        {level}
      </span>
    </span>
  )
}
