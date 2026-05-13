'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import type { ClipboardEvent, ComponentProps } from 'react'
import { AlertTriangle, FileUp, Loader2 } from 'lucide-react'

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

const ACCEPT = '.pdf,.docx,.html,.htm,.md,.markdown,.txt'

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
  const [importing, setImporting] = useState(false)
  const [includeImages, setIncludeImages] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // The split "live" preview is unusable below ~768 px  the editor
  // and preview panes each get less than a phone-width column. Watch
  // the viewport and drop to "edit" mode under the md breakpoint.
  const [preview, setPreview] = useState<'live' | 'edit'>('live')
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(min-width: 768px)')
    const sync = () => setPreview(mq.matches ? 'live' : 'edit')
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  // Insert text at the current selection (or append). The MD editor's
  // textarea is the active element while editing; for the import-button
  // path we just append a newline-separated chunk.
  const insertText = (chunk: string) => {
    setValue((prev) => {
      if (!prev.trim()) return chunk.trim()
      return `${prev.replace(/\n+$/, '')}\n\n${chunk.trim()}\n`
    })
  }

  const handleFile = async (file: File) => {
    setError(null)
    setImporting(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const qs = includeImages ? '' : '?images=0'
      const res = await fetch(`/api/admin/import-doc${qs}`, {
        method: 'POST',
        body: fd,
      })
      const data = (await res.json()) as { markdown?: string; error?: string }
      if (!res.ok || !data.markdown) {
        setError(data.error ?? `Import failed (${res.status}).`)
        return
      }
      insertText(data.markdown)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.')
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  // Paste-from-Word handler. Word, Google Docs, and most rich-text apps
  // put both `text/html` and `text/plain` on the clipboard. We intercept
  // when there's actual HTML markup, convert it to Markdown server-side,
  // and replace the pasted content with the converted text.
  const handlePaste = async (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const html = e.clipboardData.getData('text/html')
    if (!html || !/<\w+/.test(html)) return // plain text — let default paste happen
    e.preventDefault()
    setError(null)
    setImporting(true)
    try {
      const blob = new Blob([html], { type: 'text/html' })
      const fd = new FormData()
      fd.append('file', new File([blob], 'paste.html', { type: 'text/html' }))
      const res = await fetch('/api/admin/import-doc', {
        method: 'POST',
        body: fd,
      })
      const data = (await res.json()) as { markdown?: string; error?: string }
      if (!res.ok || !data.markdown) {
        setError(data.error ?? `Paste conversion failed (${res.status}).`)
        return
      }
      // Splice into the textarea at caret position.
      const target = e.currentTarget
      const start = target.selectionStart ?? value.length
      const end = target.selectionEnd ?? value.length
      const next = value.slice(0, start) + data.markdown + value.slice(end)
      setValue(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Paste conversion failed.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          className="inline-flex items-center gap-1.5 rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--cosmos-text-muted)] hover:border-[var(--cosmos-accent)] hover:text-[var(--cosmos-accent)] disabled:opacity-50"
        >
          {importing ? (
            <Loader2 size={11} aria-hidden className="animate-spin" />
          ) : (
            <FileUp size={11} aria-hidden />
          )}
          {importing ? 'Importing…' : 'Import .pdf / .docx / .html / .md'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleFile(f)
          }}
        />
        <label className="inline-flex items-center gap-1.5 font-mono text-[10px] text-[var(--cosmos-text-muted)]">
          <input
            type="checkbox"
            checked={includeImages}
            onChange={(e) => setIncludeImages(e.target.checked)}
            disabled={importing}
            className="h-3 w-3 accent-[var(--cosmos-accent)]"
          />
          Include images (PDF / DOCX)
        </label>
        <span className="font-mono text-[10px] text-[var(--cosmos-text-dim)]">
          Paste from Word / Google Docs — auto-converted to Markdown.
        </span>
      </div>

      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-[4px] border border-[var(--cosmos-critical)]/40 bg-[var(--cosmos-critical)]/10 px-3 py-2 font-mono text-[11px] text-[var(--cosmos-critical)]"
        >
          <AlertTriangle size={12} aria-hidden className="mt-0.5" />
          {error}
        </p>
      ) : null}

      <div data-color-mode="dark" className="cosmos-md-editor">
        {/* Hidden form-bound field so the surrounding server action receives the markdown. */}
        <input type="hidden" name={name} value={value} />
        <MDEditor
          value={value}
          onChange={(v) => setValue(v ?? '')}
          height={rows * 24}
          preview={preview}
          visibleDragbar={false}
          textareaProps={{
            placeholder:
              '# heading\n\nBody in **markdown**. Paste from Word/Docs is auto-converted. Code fences render with syntax highlighting on the published page.',
            spellCheck: false,
            onPaste: handlePaste,
          }}
        />
      </div>
    </div>
  )
}
