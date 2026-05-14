import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { IntelStatusBar } from '@/components/home/IntelStatusBar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { CosmosCard } from '@/components/ui/CosmosCard'
import { SeverityBadge } from '@/components/ui/SeverityBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatUTC } from '@/lib/utils/date'
import { normalizeSeverity } from '@/lib/utils/severity'
import {
  getDigestSnapshot,
  isoWeekOf,
  parseIsoWeekSlug,
  previousIsoWeek,
  recentCompletedWeeks,
  type DigestCveRow,
} from '@/lib/intel/digest'

interface DigestParams {
  week: string
}

// Refresh every 6 h. Past weeks are immutable so this is mostly for the
// current/recent weeks where the cache fills in over time.
export const revalidate = 21_600

export function generateStaticParams() {
  return recentCompletedWeeks(12).map((w) => ({ week: w.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<DigestParams>
}): Promise<Metadata> {
  const { week } = await params
  const parsed = parseIsoWeekSlug(week)
  if (!parsed) return { title: 'Digest not found' }
  return {
    title: `Digest ${parsed.slug}`,
    description: `Weekly threat-intelligence digest for ISO week ${parsed.slug} (${formatUTC(parsed.start.toISOString())}  ${formatUTC(parsed.end.toISOString())}).`,
    openGraph: {
      title: `COSMOS Digest  ${parsed.slug}`,
      description: `Top CVEs and KEV additions for ${parsed.slug}.`,
    },
  }
}

export default async function DigestWeekPage({
  params,
}: {
  params: Promise<DigestParams>
}) {
  const { week: slug } = await params
  const week = parseIsoWeekSlug(slug)
  if (!week) notFound()

  // Block requests for weeks in the future  guards against cache poisoning
  // via crafted URLs and gives crawlers a clean 404.
  const now = isoWeekOf()
  const isFuture =
    week.year > now.year ||
    (week.year === now.year && week.week > now.week)
  if (isFuture) notFound()

  const snapshot = await getDigestSnapshot(week)
  const prev = previousIsoWeek(week, 1)
  const next =
    week.year === now.year && week.week === now.week
      ? null
      : previousIsoWeek(week, -1)

  const totalsZero = snapshot.counts.total === 0 && snapshot.counts.kev === 0

  return (
    <>
      <IntelStatusBar />
      <Navbar />
      <main>
        <section className="px-4 pb-8 pt-10 sm:px-6 sm:pb-10 sm:pt-16 md:px-12 md:pt-24">
          <div className="cosmos-container">
            <SectionLabel>weekly digest</SectionLabel>
            <h1 className="max-w-3xl font-mono text-[32px] leading-[1.05] tracking-[-0.02em] text-[var(--cosmos-text)] sm:text-[40px] md:text-[56px]">
              {week.slug}
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--cosmos-text-muted)]">
              {formatUTC(week.start.toISOString())} {' '}
              {formatUTC(week.end.toISOString())}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3 font-mono text-[12px]">
              <Link href={`/digest/${prev.slug}`} className="cosmos-btn-ghost">
                ← {prev.slug}
              </Link>
              <Link href="/digest" className="cosmos-btn-ghost">
                all weeks
              </Link>
              {next ? (
                <Link href={`/digest/${next.slug}`} className="cosmos-btn-ghost">
                  {next.slug} →
                </Link>
              ) : null}
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-6">
              <Stat label="total" value={snapshot.counts.total} />
              <Stat label="critical" value={snapshot.counts.critical} />
              <Stat label="high" value={snapshot.counts.high} />
              <Stat label="medium" value={snapshot.counts.medium} />
              <Stat label="low" value={snapshot.counts.low} />
              <Stat label="new kev" value={snapshot.counts.kev} />
            </div>
          </div>
        </section>

        <section className="px-4 pb-24 sm:px-6 sm:pb-32 md:px-12">
          <div className="cosmos-container flex flex-col gap-12">
            {totalsZero ? (
              <EmptyState
                title="No data for this week"
                description="The CVE cache has no rows in this window. Either the week is in the future for your sync horizon or the cache is empty."
              />
            ) : null}

            <DigestList
              label="top critical"
              rows={snapshot.topCritical}
              emptyHint="No CRITICAL CVEs published this week."
            />
            <DigestList
              label="top high"
              rows={snapshot.topHigh}
              emptyHint="No HIGH CVEs published this week."
            />
            <DigestList
              label="new kev additions"
              rows={snapshot.newKev}
              emptyHint="No new KEV entries this week."
            />
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-code)]">
        {`// ${label}`}
      </p>
      <p className="mt-2 text-[28px] leading-none text-[var(--cosmos-text)]">
        {value.toLocaleString('en-US')}
      </p>
    </div>
  )
}

function DigestList({
  label,
  rows,
  emptyHint,
}: {
  label: string
  rows: DigestCveRow[]
  emptyHint: string
}) {
  return (
    <section>
      <SectionLabel>{label}</SectionLabel>
      {rows.length === 0 ? (
        <p className="text-[13px] text-[var(--cosmos-text-dim)]">{emptyHint}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => {
            const sev = normalizeSeverity(r.severity)
            return (
              <li key={r.cveId}>
                <CosmosCard as="article" interactive>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        href={`/intelligence/cve/${r.cveId}`}
                        className="font-mono text-[13px] text-[var(--cosmos-text)] hover:underline"
                      >
                        {r.cveId}
                      </Link>
                      <SeverityBadge level={sev} />
                      {r.isKev ? (
                        <span className="rounded-full border border-[var(--cosmos-critical)] px-2 py-[2px] font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-critical)]">
                          KEV
                        </span>
                      ) : null}
                    </div>
                    {r.cvssScore != null ? (
                      <span className="font-mono text-[18px] leading-none text-[var(--cosmos-text)]">
                        {r.cvssScore.toFixed(1)}
                      </span>
                    ) : null}
                  </div>
                  {r.description ? (
                    <p className="mt-3 text-[13px] leading-relaxed text-[var(--cosmos-text-muted)]">
                      {r.description}
                    </p>
                  ) : null}
                </CosmosCard>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
