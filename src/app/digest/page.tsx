import type { Metadata } from 'next'
import Link from 'next/link'
import { IntelStatusBar } from '@/components/home/IntelStatusBar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { CosmosCard } from '@/components/ui/CosmosCard'
import {
  isoWeekOf,
  recentCompletedWeeks,
} from '@/lib/intel/digest'
import { formatUTC } from '@/lib/utils/date'

export const metadata: Metadata = {
  title: 'Weekly Digest',
  description:
    'Weekly intelligence digests  top CVEs, KEV additions, and threat trends, archived per ISO week.',
}

// Week-list page never depends on per-week data, so cache hard.
export const revalidate = 3600

export default function DigestIndexPage() {
  const current = isoWeekOf()
  const past = recentCompletedWeeks(12)

  return (
    <>
      <IntelStatusBar />
      <Navbar />
      <main>
        <section className="px-4 pb-8 pt-10 sm:px-6 sm:pb-10 sm:pt-16 md:px-12 md:pt-24">
          <div className="cosmos-container">
            <SectionLabel>weekly digest</SectionLabel>
            <h1 className="max-w-3xl text-[32px] leading-[1.05] tracking-[-0.02em] text-[var(--cosmos-text)] sm:text-[40px] md:text-[56px]">
              Threat intelligence, summarised weekly.
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--cosmos-text-muted)]">
              Each digest is generated from the COSMOS CVE cache for one
              ISO week (Monday–Sunday, UTC). Links are shareable and
              indexable  the URL is the source of truth.
            </p>
          </div>
        </section>

        <section className="px-4 pb-24 sm:px-6 sm:pb-32 md:px-12">
          <div className="cosmos-container grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Link href={`/digest/${current.slug}`} className="contents">
              <CosmosCard interactive className="cursor-pointer">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-accent)]">
                  {'// current week'}
                </p>
                <p className="mt-2 text-[24px] text-[var(--cosmos-text)]">
                  {current.slug}
                </p>
                <p className="mt-1 font-mono text-[11px] text-[var(--cosmos-text-dim)]">
                  {formatUTC(current.start.toISOString())} {' '}
                  {formatUTC(current.end.toISOString())}
                </p>
              </CosmosCard>
            </Link>
            {past.map((w) => (
              <Link key={w.slug} href={`/digest/${w.slug}`} className="contents">
                <CosmosCard interactive className="cursor-pointer">
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-code)]">
                    {`// week ${w.week}`}
                  </p>
                  <p className="mt-2 text-[24px] text-[var(--cosmos-text)]">
                    {w.slug}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-[var(--cosmos-text-dim)]">
                    {formatUTC(w.start.toISOString())} {' '}
                    {formatUTC(w.end.toISOString())}
                  </p>
                </CosmosCard>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
