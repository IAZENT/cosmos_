'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'

/**
 * Animates a number from 0 to `value` on mount. Uses easeOutExpo over 1.5s.
 * When the user has reduced-motion preference we skip the animation.
 */
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

export interface StatCounterProps {
  value: number
  label?: string
  prefix?: string
  suffix?: string
  className?: string
  labelClassName?: string
  valueClassName?: string
  durationMs?: number
}

export function StatCounter({
  value,
  label,
  prefix,
  suffix,
  className,
  labelClassName,
  valueClassName,
  durationMs = 1500,
}: StatCounterProps) {
  const [display, setDisplay] = useState(0)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (prefersReduced) {
      // Reduced-motion users get the final value immediately. The effect
      // returns right after, so this is a one-time mount-time set, not a
      // cascading render  silencing the strict React 19 hooks rule.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplay(value)
      return
    }

    const start = performance.now()
    const from = 0
    const to = value

    const step = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / durationMs, 1)
      const eased = easeOutExpo(progress)
      setDisplay(Math.round(from + (to - from) * eased))
      if (progress < 1) {
        frameRef.current = window.requestAnimationFrame(step)
      }
    }
    frameRef.current = window.requestAnimationFrame(step)

    return () => {
      if (frameRef.current != null) {
        window.cancelAnimationFrame(frameRef.current)
      }
    }
  }, [value, durationMs])

  return (
    <div className={cn('inline-flex flex-col items-start gap-1', className)}>
      <span
        className={cn(
          'font-mono text-[36px] leading-none text-[var(--cosmos-accent)] md:text-[44px]',
          valueClassName,
        )}
      >
        {prefix}
        {display.toLocaleString('en-US')}
        {suffix}
      </span>
      {label ? (
        <span
          className={cn(
            'font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]',
            labelClassName,
          )}
        >
          {label}
        </span>
      ) : null}
    </div>
  )
}
