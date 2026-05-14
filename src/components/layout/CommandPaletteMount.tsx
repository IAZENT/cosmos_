'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

// The actual palette UI pulls in cmdk + the search icons + the SWR
// fetcher. Most users never open it, so we lazy-load the bundle and
// only mount it after the user has signalled intent (keypress, click on
// the navbar trigger). The mount component below stays in the initial
// bundle but is just an event listener  a few hundred bytes.
const CommandPalette = dynamic(
  () => import('./CommandPalette').then((m) => m.CommandPalette),
  { ssr: false },
)

export function CommandPaletteMount() {
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (armed) return
    function arm(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      const inField =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      const cmdK =
        (e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)
      const slash = e.key === '/' && !inField
      if (cmdK || slash) {
        // Don't preventDefault here  the palette's own handler does it
        // once mounted. We just trip the dynamic import.
        setArmed(true)
      }
    }
    window.addEventListener('keydown', arm)
    return () => window.removeEventListener('keydown', arm)
  }, [armed])

  if (!armed) return null
  // Pass initialOpen so the palette springs into view on its first
  // mount; subsequent toggles are handled by its own keydown handler.
  return <CommandPalette initialOpen />
}
