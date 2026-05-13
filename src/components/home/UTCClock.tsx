'use client'

import { useEffect, useState } from 'react'

function format(date: Date): string {
  const h = String(date.getUTCHours()).padStart(2, '0')
  const m = String(date.getUTCMinutes()).padStart(2, '0')
  const s = String(date.getUTCSeconds()).padStart(2, '0')
  return `${h}:${m}:${s} UTC`
}

export function UTCClock() {
  const [now, setNow] = useState<string>(() => format(new Date()))
  useEffect(() => {
    const tick = () => setNow(format(new Date()))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])
  return (
    <span
      className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-muted)]"
      suppressHydrationWarning
    >
      {now}
    </span>
  )
}
