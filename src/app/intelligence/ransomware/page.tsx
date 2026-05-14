import type { Metadata } from 'next'
import Link from 'next/link'
import { IntelStatusBar } from '@/components/home/IntelStatusBar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { CosmosCard } from '@/components/ui/CosmosCard'
import { SeverityBadge } from '@/components/ui/SeverityBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatRelative, formatUTC } from '@/lib/utils/date'
import { normalizeSeverity } from '@/lib/utils/severity'
import { getRansomwareSummary } from '@/lib/intel/ransomware'

export const metadata: Metadata = {
  title: 'Ransomware Tracker',
  description:
    'CISA KEV entries flagged as actively exploited by ransomware operators.',
  openGraph: {
    title: 'Ransomware Tracker  COSMOS',
    description:
      'CISA KEV entries flagged as actively exploited by ransomware operators.',
  },
}

// Refresh hourly  KEV publishes once a day on average, so a 60-min
// edge cache is generous.
export const revalidate = 3600

export default async function RansomwarePage() {
  const summary = await getRansomwareSummary(100)
  const empty = summary.rows.length === 0

  return (
    <>
      <IntelStatusBar />
      <Navbar />
      <main>
        <section className="px-4 pb-8 pt-10 sm:px-6 sm:pb-10 sm:pt-16 md:px-12 md:pt-24">
          <div className="cosmos-container">
            <SectionLabel>ransomware tracker</SectionLabel>
            <h1 className="max-w-3xl text-[32px] leading-[1.05] tracking-[-0.02em] text-[var(--cosmos-text)] sm:text-[40px] md:text-[56px]">
              KEV entries used in ransomware campaigns.
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--cosmos-text-muted)]">
              Sourced from CISA&apos;s Known Exploited Vulnerabilities catalog,
              filtered to entries flagged{' '}
              <code className="font-mono text-[var(--cosmos-text)]">
                knownRansomwareCampaignUse
              </code>
              . Patch cadence here is non-negotiable  these CVEs are
              actively weaponised.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
              <Stat label="ransomware kev" value={summary.total} />
              <Stat label="added · 30d" value={summary.last30d} />
              <Stat
                label="top vendor"
                value={summary.topVendors[0]?.vendor ?? ''}
                small
              />
              <Stat
                label="top product"
                value={summary.topProducts[0]?.product ?? ''}
                small
              />
            </div>
          </div>
        </section>

        <section className="px-4 pb-24 sm:px-6 sm:pb-32 md:px-12">
          <div className="cosmos-container grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="flex flex-col gap-3">
              {empty ? (
                <EmptyState
                  title="No ransomware-flagged KEV rows"
                  description="If this is a fresh deploy, run the 0007 migration and trigger /api/sync/kev to backfill the ransomware flag from CISA."
                />
              ) : null}
              {summary.rows.map((row) => {
                const severity = normalizeSeverity(row.severity)
                return (
                  <CosmosCard key={row.cveId} interactive as="article">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <Link
                          href={`/intelligence/cve/${row.cveId}`}
                          className="font-mono text-[13px] text-[var(--cosmos-text)] hover:underline"
                        >
                          {row.cveId}
                        </Link>
                        <SeverityBadge level={severity} />
                        <span className="rounded-full border border-[var(--cosmos-critical)] px-2 py-[2px] font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-critical)]">
                          ransomware
                        </span>
                      </div>
                      {row.cvssScore != null ? (
                        <span className="font-mono text-[18px] leading-none text-[var(--cosmos-text)]">
                          {row.cvssScore.toFixed(1)}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-3 text-[12px] font-mono uppercase tracking-[0.1em] text-[var(--cosmos-text-dim)]">
                      {[row.vendorProject, row.product]
                        .filter(Boolean)
                        .join(' · ') || ''}
                    </p>
                    {row.vulnerabilityName ? (
                      <p className="mt-1 text-[14px] text-[var(--cosmos-text)]">
                        {row.vulnerabilityName}
                      </p>
                    ) : null}
                    {row.description ? (
                      <p className="mt-3 text-[13px] leading-relaxed text-[var(--cosmos-text-muted)]">
                        {row.description}
                      </p>
                    ) : null}

                    {row.kevAction ? (
                      <div className="mt-4 rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] p-3">
                        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-critical)]">
                          {'// required action'}
                        </p>
                        <p className="mt-1 text-[12px] leading-relaxed text-[var(--cosmos-text-muted)]">
                          {row.kevAction}
                        </p>
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap items-center gap-3 font-mono text-[11px] text-[var(--cosmos-text-dim)]">
                      <span>added {formatRelative(row.kevAddedAt)}</span>
                      {row.kevDueDate ? (
                        <span>due {formatUTC(row.kevDueDate)}</span>
                      ) : null}
                    </div>
                  </CosmosCard>
                )
              })}
            </div>
            <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:h-fit">
              <RankList
                label="top vendors"
                items={summary.topVendors.map((v) => ({
                  name: v.vendor,
                  count: v.count,
                }))}
              />
              <RankList
                label="top products"
                items={summary.topProducts.map((p) => ({
                  name: p.product,
                  count: p.count,
                }))}
              />
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

function Stat({
  label,
  value,
  small,
}: {
  label: string
  value: number | string
  small?: boolean
}) {
  return (
    <div className="rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-code)]">
        {`// ${label}`}
      </p>
      <p
        className={`mt-2 text-[var(--cosmos-text)] ${small ? 'truncate text-[16px]' : 'text-[28px]'} leading-none`}
      >
        {typeof value === 'number' ? value.toLocaleString('en-US') : (value || '')}
      </p>
    </div>
  )
}

function RankList({
  label,
  items,
}: {
  label: string
  items: Array<{ name: string; count: number }>
}) {
  return (
    <section className="rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-5">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-code)]">
        {`// ${label}`}
      </p>
      {items.length === 0 ? (
        <p className="text-[12px] text-[var(--cosmos-text-dim)]">No data.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item.name}
              className="flex items-center justify-between gap-3 font-mono text-[12px]"
            >
              <span className="truncate text-[var(--cosmos-text)]">
                {item.name}
              </span>
              <span className="text-[var(--cosmos-text-muted)]">
                {item.count}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
