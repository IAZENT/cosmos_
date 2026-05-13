import { cn } from '@/lib/utils/cn'

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-[4px] bg-[var(--cosmos-bg-subtle)]',
        className,
      )}
    />
  )
}
