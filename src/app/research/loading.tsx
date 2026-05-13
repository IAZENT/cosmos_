import { IntelStatusBar } from '@/components/home/IntelStatusBar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'

export default function Loading() {
  return (
    <>
      <IntelStatusBar />
      <Navbar />
      <main>
        <section className="px-6 pb-10 pt-16 md:px-12 md:pt-24">
          <div className="cosmos-container">
            <SectionLabel>research &amp; wiki</SectionLabel>
            <LoadingSkeleton className="mt-4 h-12 w-2/3 max-w-3xl" />
            <LoadingSkeleton className="mt-3 h-4 w-1/2 max-w-2xl" />
          </div>
        </section>
        <section className="px-6 pb-32 md:px-12">
          <div className="cosmos-container grid grid-cols-1 gap-3 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <LoadingSkeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
