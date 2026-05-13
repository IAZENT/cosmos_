import { SectionLabel } from '@/components/ui/SectionLabel'
import { getSeverityBreakdownServer } from '@/lib/intel/server-data'
import { severityVarMap } from '@/lib/utils/severity'

const ROWS: {
  key: 'critical' | 'high' | 'medium' | 'low'
  label: string
  color: string
}[] = [
  { key: 'critical', label: 'Critical', color: severityVarMap.CRITICAL },
  { key: 'high', label: 'High', color: severityVarMap.HIGH },
  { key: 'medium', label: 'Medium', color: severityVarMap.MEDIUM },
  { key: 'low', label: 'Low', color: severityVarMap.LOW },
]

export async function SeverityBreakdown() {
  const stats = await getSeverityBreakdownServer()
  const max = Math.max(stats.critical, stats.high, stats.medium, stats.low, 1)

  return (
    <section className="rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-5">
      <SectionLabel>severity breakdown</SectionLabel>
      <ul className="flex flex-col gap-3">
        {ROWS.map((row) => {
          const value = stats[row.key]
          const pct = Math.max(0, Math.min(100, (value / max) * 100))
          return (
            <li key={row.key}>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--cosmos-text-muted)]">
                  {row.label}
                </span>
                <span className="font-mono text-[11px] text-[var(--cosmos-text)]">
                  {value.toLocaleString('en-US')}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-[var(--cosmos-bg-subtle)]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: row.color }}
                  aria-hidden
                />
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
