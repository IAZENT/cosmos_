import type { Metadata } from 'next'
import { IntelStatusBar } from '@/components/home/IntelStatusBar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { ResearchListClient } from '@/components/research/ResearchListClient'
import { listPublishedResearch } from '@/lib/content/server-data'

export const metadata: Metadata = {
  title: 'Writings',
  description:
    'Notes, writeups, and analysis: malware analysis, reverse engineering, DFIR, exploit research, CTF.',
}

export const revalidate = 60

export default async function ResearchPage() {
  const items = await listPublishedResearch()
  return (
    <>
      <IntelStatusBar />
      <Navbar />
      <main>
        <section className="px-4 pb-8 pt-10 sm:px-6 sm:pb-10 sm:pt-16 md:px-12 md:pt-24">
          <div className="cosmos-container">
            <SectionLabel>writings</SectionLabel>
            <h1 className="max-w-3xl text-[32px] leading-[1.05] tracking-[-0.02em] text-[var(--cosmos-text)] sm:text-[40px] md:text-[56px]">
              Notes, writeups, and analysis.
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--cosmos-text-muted)]">
              Malware analysis, reverse engineering, DFIR, exploit research,
              and CTF work  authored in markdown with MITRE ATT&amp;CK
              annotations.
            </p>
          </div>
        </section>
        <section className="px-4 pb-24 sm:px-6 sm:pb-32 md:px-12">
          <div className="cosmos-container">
            <ResearchListClient initialItems={items} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
