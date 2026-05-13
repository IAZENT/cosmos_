import type { Metadata } from 'next'
import Link from 'next/link'
import { IntelStatusBar } from '@/components/home/IntelStatusBar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { TOOLS } from '@/lib/tools/registry'

export const metadata: Metadata = {
  title: 'Tools',
  description:
    'Client-side cybersecurity utilities: codecs, hash analyzer, JWT inspector, CVSS calculator.',
}

export default function ToolsPage() {
  return (
    <>
      <IntelStatusBar />
      <Navbar />
      <main>
        <section className="px-4 pb-8 pt-10 sm:px-6 sm:pb-10 sm:pt-16 md:px-12 md:pt-24">
          <div className="cosmos-container">
            <SectionLabel>tooling</SectionLabel>
            <h1 className="max-w-3xl text-[32px] leading-[1.05] tracking-[-0.02em] text-[var(--cosmos-text)] sm:text-[40px] md:text-[56px]">
              Client-side utilities.
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--cosmos-text-muted)]">
              Quick, focused operators for day-to-day security work. Every tool
              runs locally in your browser  inputs never leave this tab.
            </p>
          </div>
        </section>

        <section className="px-4 pb-24 sm:px-6 sm:pb-32 md:px-12">
          <div className="cosmos-container">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {TOOLS.map((t) => (
                <Link
                  key={t.slug}
                  href={`/tools/${t.slug}`}
                  className="group flex flex-col gap-4 rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-6 transition-colors duration-150 hover:border-[var(--cosmos-text-dim)]"
                >
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-[12px] text-[var(--cosmos-text-muted)]">
                      ({t.num})
                    </span>
                  </div>
                  <h2 className="text-[20px] text-[var(--cosmos-text)]">
                    {t.title}
                  </h2>
                  <div className="h-px w-full bg-[var(--cosmos-border)]" />
                  <div className="flex items-start gap-3">
                    <t.Icon
                      size={18}
                      className="mt-1 flex-shrink-0 text-[var(--cosmos-text-dim)] transition-colors group-hover:text-[var(--cosmos-accent)]"
                      aria-hidden
                    />
                    <p className="text-[13px] leading-relaxed text-[var(--cosmos-text-muted)]">
                      {t.blurb}
                    </p>
                  </div>
                  <span className="mt-auto font-mono text-[12px] text-[var(--cosmos-accent)]">
                    → Open tool
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
