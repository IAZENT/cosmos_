import type { Metadata } from 'next'
import { Suspense } from 'react'
import { IntelStatusBar } from '@/components/home/IntelStatusBar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { CVEFeed } from '@/components/intelligence/CVEFeed'
import { KEVHighlights } from '@/components/intelligence/KEVHighlights'
import { SeverityBreakdown } from '@/components/intelligence/SeverityBreakdown'

export const metadata: Metadata = {
  title: 'Intelligence',
  description:
    'Live threat data from NVD and CISA KEV  continuously updated.',
  openGraph: {
    title: 'Intelligence  COSMOS',
    description:
      'Live threat data from NVD and CISA KEV  continuously updated.',
  },
}

export const revalidate = 60

function SidebarSkeleton({ label }: { label: string }) {
  return (
    <section className="rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-5">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-code)]">
        {`// ${label}`}
      </p>
      <div className="flex flex-col gap-3">
        <LoadingSkeleton className="h-4 w-3/4" />
        <LoadingSkeleton className="h-4 w-1/2" />
        <LoadingSkeleton className="h-4 w-2/3" />
      </div>
    </section>
  )
}

export default function IntelligencePage() {
  return (
    <>
      <IntelStatusBar />
      <Navbar />
      <main>
        <section className="px-4 pb-8 pt-10 sm:px-6 sm:pb-10 sm:pt-16 md:px-12 md:pt-24">
          <div className="cosmos-container">
            <SectionLabel>intelligence feed</SectionLabel>
            <h1 className="max-w-3xl text-[32px] leading-[1.05] tracking-[-0.02em] text-[var(--cosmos-text)] sm:text-[40px] md:text-[56px]">
              Live threat data, continuously updated.
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--cosmos-text-muted)]">
              Normalised CVEs from NVD, cross-referenced with the CISA Known
              Exploited Vulnerabilities catalog. Filter by severity, KEV
              status, or date range  click any CVE for the full record.
            </p>
          </div>
        </section>

        <section className="px-4 pb-24 sm:px-6 sm:pb-32 md:px-12">
          <div className="cosmos-container grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <CVEFeed />
            </div>
            <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:h-fit">
              {/* Sidebar tiles fetch from CISA + Supabase counts. Stream them
                  separately so the main feed paints immediately. */}
              <Suspense fallback={<SidebarSkeleton label="kev highlights" />}>
                <KEVHighlights />
              </Suspense>
              <Suspense fallback={<SidebarSkeleton label="severity breakdown" />}>
                <SeverityBreakdown />
              </Suspense>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
