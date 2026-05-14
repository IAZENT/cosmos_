import Link from 'next/link'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { HeroStats } from '@/components/home/HeroStats'
import { getIntelStatsLive } from '@/lib/intel/server-data'

const MODULES: { num: string; label: string; href: string }[] = [
  { num: '01', label: 'Intelligence', href: '/intelligence' },
  { num: '02', label: 'Writings', href: '/research' },
  { num: '03', label: 'Arsenal', href: '/arsenal' },
  { num: '04', label: 'Resources', href: '/resources' },
  { num: '05', label: 'Tools', href: '/tools' },
]

export async function HeroSection() {
  const stats = await getIntelStatsLive()

  return (
    <section className="cosmos-section pt-12 sm:pt-20 md:pt-[120px]">
      <div className="cosmos-container">
        <SectionLabel>intelligence platform</SectionLabel>

        <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:gap-12">
          <div>
            <h1 className="font-sans text-[48px] font-semibold leading-[0.95] tracking-[-0.02em] text-[var(--cosmos-text)] sm:text-[64px] md:text-[96px]">
              COSMOS
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--cosmos-text-muted)] sm:mt-6 sm:text-[18px]">
              Cybersecurity intelligence, research, and operational
              infrastructure.
            </p>

            <div className="mt-8 flex flex-wrap gap-2 sm:mt-10 sm:gap-3 md:mt-[60px]">
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

          </div>

          <div className="md:pl-8">
            <HeroStats initial={stats} />
          </div>
        </div>
      </div>
    </section>
  )
}
