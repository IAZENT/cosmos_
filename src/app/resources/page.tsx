import type { Metadata } from 'next'
import Link from 'next/link'
import { IntelStatusBar } from '@/components/home/IntelStatusBar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { ResourcesClient } from '@/components/resources/ResourcesClient'
import { listPublishedResources } from '@/lib/content/server-data'

export const metadata: Metadata = {
  title: 'Resources',
  description:
    'Curated cybersecurity tooling, learning paths, and references.',
}

export const revalidate = 60

export default async function ResourcesPage() {
  const items = await listPublishedResources()
  return (
    <>
      <IntelStatusBar />
      <Navbar />
      <main>
        <section className="px-4 pb-8 pt-10 sm:px-6 sm:pb-10 sm:pt-16 md:px-12 md:pt-24">
          <div className="cosmos-container">
            <SectionLabel>resource network</SectionLabel>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <h1 className="max-w-3xl text-[32px] leading-[1.05] tracking-[-0.02em] text-[var(--cosmos-text)] sm:text-[40px] md:text-[56px]">
                Curated intelligence, tooling, and learning references.
              </h1>
              <Link
                href="/resources/submit"
                className="cosmos-btn-ghost"
              >
                → Submit a resource
              </Link>
            </div>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--cosmos-text-muted)]">
              A human-reviewed directory. Filter by category, search by tag
              or keyword, and follow the trust rating.
            </p>
          </div>
        </section>
        <section className="px-4 pb-24 sm:px-6 sm:pb-32 md:px-12">
          <div className="cosmos-container">
            <ResourcesClient initialItems={items} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
