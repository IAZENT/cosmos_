'use client'

import { Check, Share2 } from 'lucide-react'
import { useState } from 'react'

/**
 * Client-side "copy permalink" button rendered on the CVE detail page.
 * Keeps the page itself a Server Component so metadata + JSON-LD ship
 * without a client bundle.
 */
export function CVEPermalinkActions({ cveId }: { cveId: string }) {
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    try {
      const url =
        typeof window !== 'undefined'
          ? `${window.location.origin}/intelligence/cve/${cveId}`
          : `/intelligence/cve/${cveId}`
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked  ignore */
    }
  }

  return (
    <button type="button" onClick={onCopy} className="cosmos-btn-ghost">
      {copied ? (
        <Check size={12} aria-hidden />
      ) : (
        <Share2 size={12} aria-hidden />
      )}
      {copied ? 'Link copied' : 'Copy permalink'}
    </button>
  )
}
