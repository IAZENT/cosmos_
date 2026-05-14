import { Suspense } from 'react'
import type { Metadata } from 'next'
import { IntelStatusBar } from '@/components/home/IntelStatusBar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { ArsenalClient } from '@/components/arsenal/ArsenalClient'
import {
  getArsenalCategoryCounts,
  getArsenalCopyTotal,
  listArsenal,
} from '@/lib/arsenal/server-data'
import { getCurrentUser, isAllowedAdminEmail } from '@/lib/auth/admin'

export const metadata: Metadata = {
  title: 'Arsenal  Operator knowledge base',
  description:
    'Searchable cybersecurity commands, techniques, and playbooks. Recon, exploitation, forensics, DFIR, reverse engineering, and more.',
}

export const revalidate = 60

export default async function ArsenalPage() {
  const [{ entries, total }, counts, copyTotal, user] = await Promise.all([
    listArsenal({ limit: 200 }),
    getArsenalCategoryCounts(),
    getArsenalCopyTotal(),
    getCurrentUser(),
  ])
  const isAdmin = Boolean(user && isAllowedAdminEmail(user.email ?? null))

  return (
    <>
      <IntelStatusBar />
      <Navbar />
      <main>
        <section className="px-4 pb-8 pt-10 sm:px-6 sm:pb-10 sm:pt-16 md:px-12 md:pt-24">
          <div className="cosmos-container">
            <SectionLabel>arsenal</SectionLabel>
            <h1 className="max-w-3xl text-[32px] leading-[1.05] tracking-[-0.02em] text-[var(--cosmos-text)] sm:text-[40px] md:text-[56px]">
              Operator knowledge base.
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--cosmos-text-muted)]">
              Commands, techniques, and playbooks  battle-tested and
              searchable. Curated entries for recon, exploitation, forensics,
              reverse engineering, DFIR, and CTF.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--cosmos-text-muted)]">
              <Stat label="entries" value={total} />
              <Sep />
              <Stat label="categories" value={counts.perCategory.length} />
              <Sep />
              <Stat label="copies" value={copyTotal} />
            </div>
          </div>
        </section>
        <section className="px-4 pb-24 sm:px-6 sm:pb-32 md:px-12">
          <div className="cosmos-container">
            {/* Suspense boundary required because ArsenalClient reads
                `?q=` via `useSearchParams()` (deep-links from the
                command palette). Without this, Next.js bails out of
                static prerender. */}
            <Suspense fallback={null}>
              <ArsenalClient
                initialEntries={entries}
                initialTotal={total}
                categoryCounts={counts.perCategory}
                isAdmin={isAdmin}
              />
            </Suspense>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="text-[var(--cosmos-text)]">
        {value.toLocaleString('en-US')}
      </span>
      <span className="text-[var(--cosmos-text-dim)]">{label}</span>
    </span>
  )
}

function Sep() {
  return <span className="text-[var(--cosmos-text-dim)]">·</span>
}
