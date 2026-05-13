import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { HeroStats } from '@/components/home/HeroStats'
import { getIntelStatsLive } from '@/lib/intel/server-data'

const MODULES: { num: string; label: string; href: string }[] = [
  { num: '01', label: 'Intelligence', href: '/intelligence' },
  { num: '02', label: 'Research', href: '/research' },
  { num: '03', label: 'Tools', href: '/tools' },
  { num: '04', label: 'Resources', href: '/resources' },
]

export async function HeroSection() {
  const stats = await getIntelStatsLive()

  return (
    <section className="cosmos-section pt-[80px] md:pt-[120px]">
      <div className="cosmos-container">
        <SectionLabel>intelligence platform</SectionLabel>

        <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <h1 className="font-sans text-[64px] font-semibold leading-[0.95] tracking-[-0.02em] text-[var(--cosmos-text)] md:text-[96px]">
              COSMOS
            </h1>
            <p className="mt-6 max-w-xl text-[18px] leading-relaxed text-[var(--cosmos-text-muted)]">
              Cybersecurity intelligence, research, and operational
              infrastructure.
            </p>

            <div className="mt-[60px] flex flex-wrap gap-3">
              {MODULES.map((m) => (
                <Link
                  key={m.href}
                  href={m.href}
                  className="inline-flex items-center gap-3 rounded-[4px] border border-[var(--cosmos-border)] px-3 py-2 font-mono text-[12px] text-[var(--cosmos-text-muted)] transition-colors hover:border-[var(--cosmos-text-dim)] hover:text-[var(--cosmos-text)]"
                >
                  <span className="text-[var(--cosmos-text-dim)]">
                    ({m.num})
                  </span>
                  <span>{m.label}</span>
                </Link>
              ))}
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-3">
              <Link href="/admin" className="cosmos-btn-primary">
                <ArrowRight size={14} />
                Enter Platform
              </Link>
              <Link href="/intelligence" className="cosmos-btn-ghost">
                {'// View Intelligence'}
              </Link>
            </div>
          </div>

          <div className="md:pl-8">
            <HeroStats initial={stats} />
          </div>
        </div>
      </div>
    </section>
  )
}
