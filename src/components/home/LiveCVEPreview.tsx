import Link from 'next/link'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { SeverityBadge } from '@/components/ui/SeverityBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { CosmosCard } from '@/components/ui/CosmosCard'
import { getRecentCVEsServer } from '@/lib/intel/server-data'
import { formatRelative } from '@/lib/utils/date'
import { normalizeSeverity } from '@/lib/utils/severity'

function truncate(s: string | null, max = 120): string {
  if (!s) return ''
  if (s.length <= max) return s
  return `${s.slice(0, max - 1).trimEnd()}…`
}

export async function LiveCVEPreview() {
  const items = await getRecentCVEsServer(6)

  return (
    <section className="cosmos-section">
      <div className="cosmos-container">
        <SectionLabel>live intelligence</SectionLabel>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="max-w-xl text-[40px] leading-[1.1] tracking-[-0.02em] text-[var(--cosmos-text)] md:text-[56px]">
            Latest critical vulnerabilities.
            <br />
            Updated continuously.
          </h2>
          <Link
            href="/intelligence"
            className="font-mono text-[12px] text-[var(--cosmos-accent)] hover:underline"
          >
            → View all intelligence
          </Link>
        </div>

        <div className="mt-12">
          {items.length === 0 ? (
            <EmptyState
              title="No CVE data cached yet."
              description="Run the NVD sync route (`POST /api/sync/cve`) with a valid CRON_SECRET, or configure Supabase to populate the cache."
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {items.map((cve) => {
                const sev = normalizeSeverity(cve.severity ?? null)
                return (
                  <CosmosCard
                    key={cve.id}
                    interactive
                    className="flex flex-col gap-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="font-mono text-[13px] text-[var(--cosmos-text)]">
                        {cve.cveId}
                      </span>
                      <SeverityBadge level={sev} />
                    </div>
                    <p className="min-h-[4.5rem] text-[13px] leading-relaxed text-[var(--cosmos-text-muted)]">
                      {truncate(cve.description, 140)}
                    </p>
                    <div className="mt-auto flex items-end justify-between gap-4">
                      <div>
                        <div className="font-mono text-[28px] leading-none text-[var(--cosmos-text)]">
                          {cve.cvssScore != null
                            ? cve.cvssScore.toFixed(1)
                            : ''}
                        </div>
                        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
                          CVSS score
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 text-right">
                        {cve.isKev ? (
                          <span className="rounded-full border border-[var(--cosmos-critical)] px-2 py-[2px] font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-critical)]">
                            KEV
                          </span>
                        ) : null}
                        <span className="font-mono text-[11px] text-[var(--cosmos-text-dim)]">
                          {formatRelative(cve.publishedAt)}
                        </span>
                      </div>
                    </div>
                  </CosmosCard>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
