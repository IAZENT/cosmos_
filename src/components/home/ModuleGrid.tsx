import Link from 'next/link'
import {
  BookOpen,
  Network,
  Server,
  Shield,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { SectionLabel } from '@/components/ui/SectionLabel'

interface ModuleDef {
  num: string
  title: string
  href: string
  Icon: LucideIcon
  blurb: string
  locked?: boolean
}

const MODULES: ModuleDef[] = [
  {
    num: '01',
    title: 'Intelligence',
    href: '/intelligence',
    Icon: Shield,
    blurb:
      'Live CVE feeds, KEV catalog tracking, CVSS scoring, and threat intelligence.',
  },
  {
    num: '02',
    title: 'Research',
    href: '/research',
    Icon: BookOpen,
    blurb:
      'Malware analysis, reverse engineering, DFIR notes, and exploit writeups.',
  },
  {
    num: '03',
    title: 'Resource Network',
    href: '/resources',
    Icon: Network,
    blurb:
      'Curated tooling, learning paths, and reference material for practitioners.',
  },
  {
    num: '04',
    title: 'Tooling',
    href: '/tools',
    Icon: Wrench,
    blurb:
      'Client-side utilities: hash analyser, JWT inspector, CVSS calculator, decoders.',
  },
  {
    num: '05',
    title: 'Infrastructure',
    href: '/user2admin',
    Icon: Server,
    blurb:
      'Operational surface: sync controls, content pipelines, platform telemetry.',
    locked: true,
  },
]

export function ModuleGrid() {
  return (
    <section className="cosmos-section">
      <div className="cosmos-container">
        <SectionLabel>platform modules</SectionLabel>
        <h2 className="max-w-2xl text-[40px] leading-[1.1] tracking-[-0.02em] text-[var(--cosmos-text)] md:text-[56px]">
          The complete cybersecurity
          <br />
          intelligence ecosystem.
        </h2>

        <div className="mt-16 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="group flex flex-col gap-4 rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-6 transition-colors duration-150 hover:border-[var(--cosmos-text-dim)]"
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-[12px] text-[var(--cosmos-text-muted)]">
                  ({m.num})
                </span>
                {m.locked ? (
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
                    admin
                  </span>
                ) : null}
              </div>
              <h3 className="text-[20px] text-[var(--cosmos-text)]">
                {m.title}
              </h3>
              <div className="h-px w-full bg-[var(--cosmos-border)]" />
              <div className="flex items-start gap-3">
                <m.Icon
                  size={18}
                  className="mt-1 flex-shrink-0 text-[var(--cosmos-text-dim)] transition-colors group-hover:text-[var(--cosmos-accent)]"
                  aria-hidden
                />
                <p className="text-[13px] leading-relaxed text-[var(--cosmos-text-muted)]">
                  {m.blurb}
                </p>
              </div>
              <span className="mt-auto font-mono text-[12px] text-[var(--cosmos-accent)]">
                → Open module
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
