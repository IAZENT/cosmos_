import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { IntelStatusBar } from '@/components/home/IntelStatusBar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { SubmitResourceForm } from './SubmitResourceForm'

export const metadata: Metadata = {
  title: 'Submit a resource',
  description:
    'Suggest a link for the COSMOS resource directory. Submissions are reviewed before publishing.',
}

export default function SubmitResourcePage() {
  return (
    <>
      <IntelStatusBar />
      <Navbar />
      <main>
        <section className="px-6 pb-24 pt-12 md:px-12 md:pt-16">
          <div className="cosmos-container max-w-3xl">
            <Link
              href="/resources"
              className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--cosmos-text-muted)] hover:text-[var(--cosmos-text)]"
            >
              <ChevronLeft size={12} aria-hidden /> Back to resources
            </Link>
            <SectionLabel className="mt-6">submit a resource</SectionLabel>
            <h1 className="text-[40px] leading-[1.05] tracking-[-0.02em] text-[var(--cosmos-text)] md:text-[48px]">
              Suggest a link.
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--cosmos-text-muted)]">
              Entries are queued as drafts and reviewed by an administrator
              before they appear publicly. You won&apos;t see your submission
              on <code className="font-mono">/resources</code> immediately.
            </p>

            <div className="mt-10 rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-6">
              <SubmitResourceForm />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
