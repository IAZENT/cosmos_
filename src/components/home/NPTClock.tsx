'use client'

import { useEffect, useState } from 'react'

// Kathmandu is UTC+5:45 with no DST. Using `Intl.DateTimeFormat` with
// the IANA tz "Asia/Kathmandu" keeps the 45-minute offset correct
// regardless of where the user's browser thinks it is.
const FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Kathmandu',
  hour12: true,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

function format(date: Date): string {
  // Intl emits e.g. "09:33:52 PM"  append the timezone label ourselves.
  const parts = FORMATTER.formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? ''
  return `${get('hour')}:${get('minute')}:${get('second')} ${get('dayPeriod')} NPT`
}

export function NPTClock() {
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
