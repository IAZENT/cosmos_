'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { refreshSessionAction } from '@/app/admin/actions'

export function SessionRefreshButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await refreshSessionAction()
          // Force the server component to re-render with the fresh JWT.
          router.refresh()
        })
      }
      className="inline-flex items-center gap-1.5 rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--cosmos-text-muted)] hover:text-[var(--cosmos-text)] disabled:opacity-50"
    >
      <RefreshCw
        size={11}
        aria-hidden
        className={pending ? 'animate-spin' : ''}
      />
      {pending ? 'refreshing…' : 'refresh token'}
    </button>
  )
}
