import type { ReactNode } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { IntelStatusBar } from '@/components/home/IntelStatusBar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SectionLabel } from '@/components/ui/SectionLabel'

export function ToolLayout({
  title,
  tagline,
  label = 'security tool',
  children,
  privacyNote = 'All computation happens locally in your browser. Nothing is transmitted.',
}: {
  title: string
  tagline: string
  label?: string
  children: ReactNode
  privacyNote?: string
}) {
  return (
    <>
      <IntelStatusBar />
      <Navbar />
      <main>
        <section className="px-4 pb-6 pt-8 sm:px-6 sm:pb-8 sm:pt-12 md:px-12 md:pt-16">
          <div className="cosmos-container max-w-4xl">
            <Link
              href="/tools"
              className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--cosmos-text-muted)] hover:text-[var(--cosmos-text)]"
            >
              <ChevronLeft size={12} aria-hidden /> All tools
            </Link>
            <SectionLabel className="mt-6">{label}</SectionLabel>
            <h1 className="text-[32px] leading-[1.05] tracking-[-0.02em] text-[var(--cosmos-text)] sm:text-[40px] md:text-[52px]">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[var(--cosmos-text-muted)]">
              {tagline}
            </p>
            <p className="mt-3 max-w-2xl font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--cosmos-code)]">
              {`// ${privacyNote}`}
            </p>
          </div>
        </section>
        <section className="px-4 pb-20 sm:px-6 sm:pb-28 md:px-12">
          <div className="cosmos-container max-w-4xl">{children}</div>
        </section>
      </main>
      <Footer />
    </>
  )
}
