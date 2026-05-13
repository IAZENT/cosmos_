import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { IntelStatusBar } from '@/components/home/IntelStatusBar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SectionLabel } from '@/components/ui/SectionLabel'

export default function CVENotFound() {
  return (
    <>
      <IntelStatusBar />
      <Navbar />
      <main>
        <section className="px-4 pb-24 pt-12 sm:px-6 sm:pt-16 md:px-12 md:pt-24">
          <div className="cosmos-container max-w-2xl">
            <Link
              href="/intelligence"
              className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--cosmos-text-muted)] hover:text-[var(--cosmos-text)]"
            >
              <ChevronLeft size={12} aria-hidden /> All intelligence
            </Link>
            <SectionLabel className="mt-6">404 · vulnerability record</SectionLabel>
            <h1 className="text-[32px] leading-tight tracking-[-0.01em] text-[var(--cosmos-text)] sm:text-[40px]">
              That CVE isn&apos;t in the catalog.
            </h1>
            <p className="mt-4 text-[14px] leading-relaxed text-[var(--cosmos-text-muted)]">
              We couldn&apos;t find that record in our cache or upstream at
              NVD. It may be malformed, withdrawn, or simply too new to have
              been published. Double-check the ID format
              (<span className="font-mono">CVE-YYYY-NNNNN</span>) and try
              again, or browse the live feed.
            </p>
            <div className="mt-8 flex gap-3">
              <Link href="/intelligence" className="cosmos-btn-primary">
                → Browse intelligence
              </Link>
              <a
                href="https://nvd.nist.gov/vuln/search"
                target="_blank"
                rel="noopener noreferrer"
                className="cosmos-btn-ghost"
              >
                NVD search
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
