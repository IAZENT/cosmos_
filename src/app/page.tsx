import { Suspense } from 'react'
import { IntelStatusBar } from '@/components/home/IntelStatusBar'
import { Navbar } from '@/components/layout/Navbar'
import { HeroSection } from '@/components/home/HeroSection'
import { ThreatTicker } from '@/components/home/ThreatTicker'
import { ModuleGrid } from '@/components/home/ModuleGrid'
import { LiveCVEPreview } from '@/components/home/LiveCVEPreview'
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
      </main>
      <Footer />
    </>
  )
}

function HeroSkeleton() {
  return (
    <section className="cosmos-section pt-[80px] md:pt-[120px]">
      <div className="cosmos-container">
        <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <LoadingSkeleton className="h-[64px] w-[280px] md:h-[96px] md:w-[420px]" />
            <LoadingSkeleton className="mt-6 h-5 w-2/3 max-w-xl" />
          </div>
          <div className="flex flex-col gap-6 md:items-end">
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
