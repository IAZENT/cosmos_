import { Suspense } from 'react'
import type { Metadata } from 'next'
import { IntelStatusBar } from '@/components/home/IntelStatusBar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { NewsSections } from '@/components/news/NewsSections'

export const metadata: Metadata = {
  title: 'News · COSMOS',
  description:
    'Live security news  international cyber wires, Nepal tech feeds, threat-intel pulses, and live phishing / urlscan submissions.',
}

// Server-rendered every 5 min; Suspense streams the upstreams in the
// background so the page shell paints immediately.
export const revalidate = 300

export default function NewsPage() {
  return (
    <>
      <IntelStatusBar />
      <Navbar />
      <main>
        <section className="cosmos-section pt-[80px] md:pt-[120px]">
          <div className="cosmos-container">
            <SectionLabel>live feed</SectionLabel>
            <h1 className="mt-2 font-sans text-[40px] font-semibold leading-[1.05] tracking-[-0.02em] text-[var(--cosmos-text)] md:text-[56px]">
              News
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--cosmos-text-muted)]">
              International cyber wires, Nepal tech reporting, AlienVault
              OTX pulses, OpenPhish hits and recent urlscan.io malicious
              verdicts  all in one feed.
            </p>
            <Suspense fallback={<NewsSkeleton />}>
              <NewsSectionsAsync />
            </Suspense>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

async function NewsSectionsAsync() {
  const { fetchNewsBundle } = await import('@/lib/api/news')
  const bundle = await fetchNewsBundle()
  return <NewsSections bundle={bundle} />
}

function NewsSkeleton() {
  return (
    <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <LoadingSkeleton key={i} className="h-44 w-full" />
      ))}
    </div>
  )
}
