'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * SearchHighlight  when the page is visited with `?highlight=<query>`
 * (deep-link from the global Cmd+K search), this component:
 *
 *   1. Walks the article DOM under `[data-search-target]` to find the
 *      first text-node occurrence of the query (case-insensitive).
 *   2. Wraps that occurrence in a `<mark class="cosmos-search-mark">`
 *      so it is visually highlighted.
 *   3. Smooth-scrolls the highlight into view.
 *   4. Removes the highlight after 6s so the page returns to its
 *      normal style.
 *
 * Pure DOM mutation; no React re-render. Safe to mount once at the top
 * of the article.
 */
export function SearchHighlight({
  targetSelector = '[data-search-target]',
}: {
  targetSelector?: string
}) {
  const params = useSearchParams()
  const highlight = params.get('highlight')?.trim() ?? ''

  useEffect(() => {
    if (!highlight) return
    const root = document.querySelector(targetSelector)
    if (!root || !(root instanceof HTMLElement)) return

    const needle = highlight.toLowerCase()
    if (needle.length < 2) return

    // depth-first text-node walk
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue) return NodeFilter.FILTER_REJECT
        // Skip script/style/code-block content – we still highlight in
        // <p>, <li>, <h*>, <strong> etc. because Markdown renders to
        // those.
        const parent = node.parentElement
        if (!parent) return NodeFilter.FILTER_REJECT
        const tag = parent.tagName
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT')
          return NodeFilter.FILTER_REJECT
        return node.nodeValue.toLowerCase().includes(needle)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT
      },
    })

    const target = walker.nextNode() as Text | null
    if (!target || !target.nodeValue || !target.parentNode) return

    const value = target.nodeValue
    const idx = value.toLowerCase().indexOf(needle)
    if (idx < 0) return

    // Split the text node into [before][match][after] and replace the
    // match with a <mark>.
    const before = value.slice(0, idx)
    const match = value.slice(idx, idx + needle.length)
    const after = value.slice(idx + needle.length)

    const mark = document.createElement('mark')
    mark.className = 'cosmos-search-mark'
    mark.textContent = match

    const beforeNode = document.createTextNode(before)
    const afterNode = document.createTextNode(after)

    const parent = target.parentNode
    parent.insertBefore(beforeNode, target)
    parent.insertBefore(mark, target)
    parent.insertBefore(afterNode, target)
    parent.removeChild(target)

    // Scroll into view (smooth) – with sticky navbar offset.
    window.requestAnimationFrame(() => {
      mark.scrollIntoView({ behavior: 'smooth', block: 'center' })
      mark.classList.add('cosmos-search-mark--pulse')
    })

    // Auto-fade the highlight after 6s so the page returns to normal.
    const t = window.setTimeout(() => {
      mark.classList.add('cosmos-search-mark--fade')
    }, 6000)

    return () => {
      window.clearTimeout(t)
    }
  }, [highlight, targetSelector])

  return null
}
