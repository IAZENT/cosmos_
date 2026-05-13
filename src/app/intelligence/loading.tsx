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
            <SectionLabel>intelligence feed</SectionLabel>
            <LoadingSkeleton className="mt-4 h-12 w-3/4 max-w-3xl" />
            <LoadingSkeleton className="mt-3 h-4 w-2/3 max-w-2xl" />
          </div>
        </section>
        <section className="px-6 pb-32 md:px-12">
          <div className="cosmos-container grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="flex flex-col gap-3">
              <LoadingSkeleton className="h-24 w-full" />
              {Array.from({ length: 5 }).map((_, i) => (
                <LoadingSkeleton key={i} className="h-32 w-full" />
              ))}
            </div>
            <aside className="flex flex-col gap-6">
              <LoadingSkeleton className="h-56 w-full" />
              <LoadingSkeleton className="h-48 w-full" />
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
