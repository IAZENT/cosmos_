'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import type { ComponentProps } from 'react'

// MDEditor ships its own heavy ESM bundle; lazy-load it client-side only.
const MDEditor = dynamic<ComponentProps<typeof import('@uiw/react-md-editor').default>>(
  () => import('@uiw/react-md-editor'),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 animate-pulse rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)]" />
    ),
  },
)

export function MarkdownEditor({
  name,
  defaultValue,
  rows = 20,
}: {
  name: string
  defaultValue?: string
  rows?: number
}) {
  const [value, setValue] = useState(defaultValue ?? '')
  return (
    <div data-color-mode="dark" className="cosmos-md-editor">
      {/* Hidden form-bound field so the surrounding server action receives the markdown. */}
      <input type="hidden" name={name} value={value} />
      <MDEditor
        value={value}
        onChange={(v) => setValue(v ?? '')}
        height={rows * 24}
        preview="live"
        visibleDragbar={false}
        textareaProps={{
          placeholder:
            '# heading\n\nBody in **markdown**. Code fences render with syntax highlighting on the published page.',
          spellCheck: false,
        }}
      />
    </div>
  )
}
