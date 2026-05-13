import { getTickerCVEsServer, type TickerCVE } from '@/lib/intel/server-data'
import { severityVarMap, type Severity } from '@/lib/utils/severity'

function TickerItem({ cve }: { cve: TickerCVE }) {
  const sev = (cve.severity ?? 'NONE') as Severity
  const color = severityVarMap[sev]
  return (
    <span className="mx-6 inline-flex items-center gap-3 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.1em]">
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span className="text-[var(--cosmos-text)]">{cve.cveId}</span>
      <span style={{ color }}>{sev}</span>
      <span className="text-[var(--cosmos-text-muted)]">
        {cve.cvssScore != null ? cve.cvssScore.toFixed(1) : ''}
      </span>
    </span>
  )
}

export async function ThreatTicker() {
  const items = await getTickerCVEsServer(20)
  if (items.length === 0) {
    return (
      <div
        aria-label="Threat ticker"
        className="flex h-10 items-center overflow-hidden border-y border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] px-6 md:px-12"
      >
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
          {'// awaiting first sync · no CVE data yet'}
        </span>
      </div>
    )
  }

  // Duplicate to keep the loop seamless  the marquee keyframe translates -50%.
  const doubled = [...items, ...items]

  return (
    <div
      aria-label="Threat ticker"
      className="flex h-10 items-center overflow-hidden border-y border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)]"
    >
      <div className="flex w-max animate-marquee items-center">
        {doubled.map((cve, idx) => (
          <span
            key={`${cve.cveId}-${idx}`}
            className="flex items-center"
          >
            <TickerItem cve={cve} />
            <span
              aria-hidden
              className="text-[var(--cosmos-text-dim)]"
            >
              ·
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
