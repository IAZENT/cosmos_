import { Star } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export function TrustRating({
  rating,
  className,
}: {
  rating: number | null | undefined
  className?: string
}) {
  const value = Math.max(0, Math.min(5, rating ?? 0))
  return (
    <span
      className={cn('inline-flex items-center gap-0.5', className)}
      aria-label={`Trust rating ${value} of 5`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={11}
          className={
            i < value
              ? 'fill-[var(--cosmos-accent)] text-[var(--cosmos-accent)]'
              : 'text-[var(--cosmos-text-dim)]'
          }
          aria-hidden
        />
      ))}
    </span>
  )
}
