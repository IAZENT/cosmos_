'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
     
    console.error('cosmos error boundary:', error)
  }, [error])

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="max-w-xl text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--cosmos-critical)]">
          {'// runtime error'}
        </p>
        <h1 className="mt-4 text-[40px] leading-[1.05] tracking-[-0.02em] text-[var(--cosmos-text)]">
          Something cracked.
        </h1>
        <p className="mt-3 font-mono text-[12px] text-[var(--cosmos-text-muted)]">
          {error.message || 'Unhandled error in the rendering pipeline.'}
        </p>
        {error.digest ? (
          <p className="mt-1 font-mono text-[10px] text-[var(--cosmos-text-dim)]">
            ref: {error.digest}
          </p>
        ) : null}
        <div className="mt-6 flex justify-center gap-3">
          <button type="button" onClick={reset} className="cosmos-btn-primary">
            ↻ Retry
          </button>
          <Link href="/" className="cosmos-btn-ghost">
            ← Home
          </Link>
        </div>
      </div>
    </main>
  )
}
