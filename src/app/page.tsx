import { Suspense } from 'react'
import { IntelStatusBar } from '@/components/home/IntelStatusBar'
import { Navbar } from '@/components/layout/Navbar'
import { HeroSection } from '@/components/home/HeroSection'
import { ThreatTicker } from '@/components/home/ThreatTicker'
import { ModuleGrid } from '@/components/home/ModuleGrid'
import { LiveCVEPreview } from '@/components/home/LiveCVEPreview'
import { ScholarshipPreview } from '@/components/home/ScholarshipPreview'
import { Footer } from '@/components/layout/Footer'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'

export const revalidate = 60 // Refresh server-rendered sections every minute.

// Stream every data-bound section independently so the static shell paints
// immediately and slow upstreams (NVD / CISA / Supabase) only delay their
// own panel  never the whole page.
export default function HomePage() {
  return (
    <>
      <IntelStatusBar />
      <Navbar />
      <main>
        <Suspense fallback={<HeroSkeleton />}>
          <HeroSection />
        </Suspense>
        <Suspense
          fallback={
            <div className="h-10 border-y border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)]" />
          }
        >
          <ThreatTicker />
        </Suspense>
        <ModuleGrid />
        <Suspense fallback={<LiveCVESkeleton />}>
          <LiveCVEPreview />
        </Suspense>
        {/* Async server component: hits Supabase to count news mentions
            for the cycles it picks, so the 'live · N' badge auto-updates
            as the RSS sync writes new rows. Cheap query (one round trip,
            ≤200 rows) but suspended so it never blocks the rest of the
            shell. */}
        <Suspense fallback={<ScholarshipSkeleton />}>
          <ScholarshipPreview />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}

function HeroSkeleton() {
  // Matches the real HeroSection layout: wordmark + tagline + 4 module
  // chips on the left, three stat counters on the right.
  return (
    <section className="cosmos-section pt-12 sm:pt-20 md:pt-[120px]">
      <div className="cosmos-container">
        <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:gap-12">
          <div>
            <LoadingSkeleton className="h-[48px] w-[220px] sm:h-[64px] sm:w-[280px] md:h-[96px] md:w-[420px]" />
            <LoadingSkeleton className="mt-4 h-4 w-2/3 max-w-xl sm:mt-6 sm:h-5" />
            <div className="mt-8 flex flex-wrap gap-2 sm:mt-10 sm:gap-3 md:mt-[60px]">
              {Array.from({ length: 4 }).map((_, i) => (
                <LoadingSkeleton key={i} className="h-9 w-32" />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-6 md:items-end md:pl-8">
            <LoadingSkeleton className="h-10 w-40" />
            <LoadingSkeleton className="h-10 w-32" />
            <LoadingSkeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    </section>
  )
}

function LiveCVESkeleton() {
  return (
    <section className="cosmos-section">
      <div className="cosmos-container">
        <LoadingSkeleton className="h-12 w-[420px] max-w-full" />
        <div className="mt-12 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      </div>
    </section>
  )
}

function ScholarshipSkeleton() {
  // Three placeholder cards while the live mention-count query resolves.
  return (
    <section className="cosmos-section">
      <div className="cosmos-container">
        <LoadingSkeleton className="h-12 w-[360px] max-w-full" />
        <div className="mt-12 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      </div>
    </section>
  )
}
