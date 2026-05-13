'use client'

import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils/cn'

export function CopyButton({
  value,
  label = 'Copy',
  className,
  size = 'sm',
}: {
  value: string | (() => string)
  label?: string
  className?: string
  size?: 'sm' | 'md'
}) {
  const [copied, setCopied] = useState(false)
  const handle = async () => {
    try {
      const v = typeof value === 'function' ? value() : value
      await navigator.clipboard.writeText(v)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard may be unavailable (insecure context) */
    }
  }
  const sizing =
    size === 'md'
      ? 'px-3 py-1.5 text-[11px]'
      : 'px-2 py-1 text-[10px]'
  return (
    <button
      type="button"
      onClick={handle}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[4px] border font-mono uppercase tracking-[0.12em] transition-colors',
        'border-[var(--cosmos-border)] text-[var(--cosmos-text-muted)] hover:border-[var(--cosmos-text-dim)] hover:text-[var(--cosmos-text)]',
        sizing,
        className,
      )}
      aria-label={copied ? 'Copied' : label}
    >
      {copied ? <Check size={11} aria-hidden /> : <Copy size={11} aria-hidden />}
      {copied ? 'copied' : label}
    </button>
  )
}
