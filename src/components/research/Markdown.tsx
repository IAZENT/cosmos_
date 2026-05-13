'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/atom-one-dark.css'
import type { Components } from 'react-markdown'

const components: Components = {
  h1: (props) => (
    <h1 className="mt-10 text-[32px] leading-[1.1] tracking-[-0.01em] text-[var(--cosmos-text)]" {...props} />
  ),
  h2: (props) => (
    <h2 className="mt-10 text-[24px] leading-[1.15] tracking-[-0.01em] text-[var(--cosmos-text)]" {...props} />
  ),
  h3: (props) => (
    <h3 className="mt-8 text-[18px] leading-[1.2] text-[var(--cosmos-text)]" {...props} />
  ),
  p: (props) => (
    <p className="mt-4 text-[15px] leading-relaxed text-[var(--cosmos-text-muted)]" {...props} />
  ),
  a: (props) => (
    <a
      {...props}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[var(--cosmos-accent)] underline underline-offset-4 hover:text-[var(--cosmos-text)]"
    />
  ),
  ul: (props) => (
    <ul className="mt-4 list-disc space-y-1 pl-5 text-[15px] leading-relaxed text-[var(--cosmos-text-muted)] marker:text-[var(--cosmos-text-dim)]" {...props} />
  ),
  ol: (props) => (
    <ol className="mt-4 list-decimal space-y-1 pl-5 text-[15px] leading-relaxed text-[var(--cosmos-text-muted)] marker:text-[var(--cosmos-text-dim)]" {...props} />
  ),
  li: (props) => <li {...props} />,
  blockquote: (props) => (
    <blockquote
      className="mt-4 border-l-2 border-[var(--cosmos-accent-dim)] pl-4 text-[14px] italic text-[var(--cosmos-text-muted)]"
      {...props}
    />
  ),
  code({ className, children, ...rest }) {
    const isInline = !(className ?? '').includes('language-')
    if (isInline) {
      return (
        <code
          className="rounded-[3px] bg-[var(--cosmos-bg-subtle)] px-1.5 py-[1px] font-mono text-[13px] text-[var(--cosmos-accent)]"
          {...rest}
        >
          {children}
        </code>
      )
    }
    return (
      <code className="font-mono text-[13px] text-[var(--cosmos-text)]" {...rest}>
        {children}
      </code>
    )
  },
  pre: (props) => (
    <pre
      className="mt-4 overflow-x-auto rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] p-4 leading-relaxed"
      {...props}
    />
  ),
  hr: () => <hr className="mt-10 border-[var(--cosmos-border-dim)]" />,
  table: (props) => (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full border-collapse text-left font-mono text-[12px]" {...props} />
    </div>
  ),
  th: (props) => (
    <th
      className="border-b border-[var(--cosmos-border)] px-3 py-2 font-normal uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]"
      {...props}
    />
  ),
  td: (props) => (
    <td className="border-b border-[var(--cosmos-border-dim)] px-3 py-2 text-[var(--cosmos-text-muted)]" {...props} />
  ),
  img: (props) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      className="mt-4 rounded-[6px] border border-[var(--cosmos-border)]"
      alt={props.alt ?? ''}
    />
  ),
}

export function Markdown({ source }: { source: string }) {
  return (
    <div className="cosmos-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
        components={components}
      >
        {source}
      </ReactMarkdown>
    </div>
  )
}
