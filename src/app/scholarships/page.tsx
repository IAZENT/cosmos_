import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { ScholarshipFeed } from '@/components/scholarships/ScholarshipFeed'

export const metadata: Metadata = {
  title: 'Scholarships',
  description:
    'Live scholarship and fellowship postings for Bachelor, Master, PhD, and Postdoc study  aggregated from OpportunityDesk, Scholars4Dev, EURAXESS, and more.',
  alternates: {
    canonical: '/scholarships',
  },
  openGraph: {
    title: 'Scholarships  COSMOS',
    description:
      'Live scholarship and fellowship postings for Bachelor, Master, PhD, and Postdoc study, aggregated from primary sources.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scholarships  COSMOS',
    description:
      'Live scholarship and fellowship postings, aggregated from primary sources.',
  },
}

export const revalidate = 300

export default function ScholarshipsPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="px-4 pb-8 pt-10 sm:px-6 sm:pb-10 sm:pt-16 md:px-12 md:pt-24">
          <div className="cosmos-container">
            <SectionLabel>scholarship intelligence</SectionLabel>
            <h1 className="max-w-3xl text-[32px] leading-[1.05] tracking-[-0.02em] text-[var(--cosmos-text)] sm:text-[40px] md:text-[56px]">
              Find your next scholarship,
              <br />
              <span className="text-[var(--cosmos-accent)]">
                continuously updated.
              </span>
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--cosmos-text-muted)]">
              Aggregated from <strong>OpportunityDesk</strong>,{' '}
              <strong>Scholars4Dev</strong>,{' '}
              <strong>ScholarshipRegion</strong>,{' '}
              <strong>ScholarshipRoar</strong>,{' '}
              <strong>Studying-in-Germany</strong>, and the official EU{' '}
              <strong>EURAXESS</strong> portal. Filter by country, level, or
              funding type. Click through to apply on the original site 
              we never gate the source.
            </p>
            <p className="mt-3 max-w-2xl font-mono text-[11px] text-[var(--cosmos-text-dim)]">
              {'// '}refreshed every 6 hours · sources are public RSS / JSON ·
              no affiliation
            </p>
          </div>
        </section>

        <section className="px-4 pb-24 sm:px-6 sm:pb-32 md:px-12">
          <div className="cosmos-container">
            <ScholarshipFeed />
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
