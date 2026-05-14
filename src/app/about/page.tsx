import type { Metadata } from 'next'
import { Mail } from 'lucide-react'

function GithubIcon({ size = 14, className, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  )
}

function LinkedinIcon({ size = 14, className, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}
import { IntelStatusBar } from '@/components/home/IntelStatusBar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { SOCIAL_LINKS, emailHref } from '@/lib/config/social'

/**
 * /about  Operator profile.
 *
 * Pure Server Component, no data fetching. Content is intentionally
 * static and minimal per COSMOS_ABOUT_BUILD_PROMPT.md (under-90s read,
 * single column, max 680px).
 */
export const metadata: Metadata = {
  title: 'About',
  description:
    'Rupesh K. Thakur  Cybersecurity student, researcher, and builder of COSMOS.',
}

const FOCUS_AREAS = [
  'Reverse Engineering',
  'Malware Analysis',
  'Digital Forensics & IR',
  'Penetration Testing',
  'Threat Intelligence',
  'Web Application Security',
] as const

const HIGHLIGHTS: { num: string; title: string; description: string }[] = [
  {
    num: '01',
    title: 'SslReq.exe  Static malware analysis',
    description:
      '.NET backdoor reverse engineering, string deobfuscation, network behaviour reconstruction.',
  },
  {
    num: '02',
    title: 'Emotet Epoch 2  Dynamic malware analysis',
    description:
      'Behavioural sandbox analysis, C2 identification, persistence mechanism documentation.',
  },
  {
    num: '03',
    title: 'Symfonos:2  APT1 threat emulation',
    description:
      'Full kill chain against VulnHub target, 17 MITRE ATT&CK techniques mapped across the engagement.',
  },
  {
    num: '04',
    title: 'TTCTF  ExByte forensics challenge',
    description:
      'PCAP analysis, HTTP-based PNG exfiltration via hex-encoded chunks, flag recovery.',
  },
  {
    num: '05',
    title: 'COSMOS  Live cybersecurity intelligence platform',
    description:
      'Full-stack build: Next.js 14, Supabase, Vercel. Live CVE feeds, KEV tracking, operator knowledge base.',
  },
]

const FOCUS_ITEMS: { title: string; subtitle: string; description: string }[] =
  [
    {
      title: 'AHRIP',
      subtitle: 'Adaptive Human Risk Intelligence Platform',
      description:
        'Final-year project: Cybersecurity awareness platform with rule-based adaptive engine, live threat feeds, and employee risk scoring for SME environments.',
    },
  ]

export default function AboutPage() {
  return (
    <>
      <IntelStatusBar />
      <Navbar />
      <main>
        <article className="mx-auto w-full max-w-[680px] px-4 pb-24 pt-12 sm:px-6 sm:pt-16 md:px-12 md:pt-20">
          {/* Hero  operator block */}
          <section>
            <SectionLabel>operator</SectionLabel>
            <h1 className="mt-3 font-sans text-[40px] font-medium leading-[1.05] tracking-[-0.02em] text-[var(--cosmos-text)]">
              Rupesh K. Thakur
            </h1>
            <p className="mt-3 text-[16px] leading-relaxed text-[var(--cosmos-text-muted)]">
              Cybersecurity &amp; Ethical Hacking Student
            </p>
            <div className="mt-6 space-y-1 font-mono text-[13px] leading-relaxed text-[var(--cosmos-text-dim)]">
              <p>Coventry University (via Softwarica College, Kathmandu)</p>
              <p>BSc (Hons) Cybersecurity &amp; Ethical Hacking  2026</p>
            </div>
          </section>

          <Divider />

          {/* About COSMOS */}
          <section>
            <SectionLabel>about cosmos</SectionLabel>
            <p className="mt-5 text-[15px] leading-[1.8] text-[var(--cosmos-text-muted)]">
              COSMOS is my operational infrastructure a live platform built to
              aggregate threat intelligence, publish security research,
              writeups, techniques, experiences and maintain a searchable
              knowledge base of techniques I use in the field.
            </p>
          </section>

          <Divider />

          {/* Current focus */}
          <section>
            <SectionLabel>current focus</SectionLabel>
            <div className="mt-6 space-y-5">
              {FOCUS_ITEMS.map((item) => (
                <FocusCard key={item.title} {...item} />
              ))}
            </div>
          </section>

          <Divider />

          {/* Field notes */}
          <section>
            <SectionLabel>field notes</SectionLabel>
            <p className="mt-2 font-mono text-[12px] text-[var(--cosmos-text-dim)]">
              Selected work and engagements
            </p>
            <ol className="mt-6 divide-y divide-[var(--cosmos-border-dim)]">
              {HIGHLIGHTS.map((entry) => (
                <li
                  key={entry.num}
                  className="flex gap-6 py-5 first:pt-0 last:pb-0"
                >
                  <span className="shrink-0 font-mono text-[12px] text-[var(--cosmos-text-dim)]">
                    ({entry.num})
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="font-sans text-[14px] font-medium leading-[1.4] text-[var(--cosmos-text)]">
                      {entry.title}
                    </h3>
                    <p className="font-sans text-[13px] leading-[1.7] text-[var(--cosmos-text-muted)]">
                      {entry.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <Divider />

          {/* Focus areas */}
          <section>
            <SectionLabel>focus areas</SectionLabel>
            <ul className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {FOCUS_AREAS.map((area) => (
                <li key={area}>
                  <span
                    className="block rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] px-[14px] py-[6px] text-center font-mono text-[12px] text-[var(--cosmos-text-muted)] transition-colors hover:text-[var(--cosmos-text)]"
                  >
                    {area}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <Divider />

          {/* Connect */}
          <section>
            <SectionLabel>connect</SectionLabel>
            <ul className="mt-6 flex flex-col gap-4">
              <ConnectLink
                Icon={GithubIcon}
                label="GitHub"
                href={SOCIAL_LINKS.github}
                display={stripScheme(SOCIAL_LINKS.github)}
                external
              />
              <ConnectLink
                Icon={LinkedinIcon}
                label="LinkedIn"
                href={SOCIAL_LINKS.linkedin}
                display={stripScheme(SOCIAL_LINKS.linkedin)}
                external
              />
              <ConnectLink
                Icon={Mail}
                label="Email"
                href={emailHref(SOCIAL_LINKS.email)}
                display={SOCIAL_LINKS.email.replace(/^mailto:/, '')}
              />
            </ul>
          </section>
        </article>
      </main>
      <Footer />
    </>
  )
}

function Divider() {
  return (
    <div
      className="my-12 h-px w-full bg-[var(--cosmos-border-dim)]"
      role="presentation"
    />
  )
}

function FocusCard({
  title,
  subtitle,
  description,
}: {
  title: string
  subtitle: string
  description: string
}) {
  return (
    <div className="group border-l-2 border-[var(--cosmos-border)] py-3 pl-5 transition-colors hover:border-[var(--cosmos-accent)]">
      <p className="flex items-baseline gap-2">
        <span className="font-mono text-[13px] text-[var(--cosmos-accent)]">
          →
        </span>
        <span className="font-sans text-[15px] font-medium text-[var(--cosmos-text)]">
          {title}
        </span>
      </p>
      {subtitle ? (
        <p className="mt-1 pl-5 text-[13px] text-[var(--cosmos-text-muted)]">
          {subtitle}
        </p>
      ) : null}
      {description ? (
        <p className="mt-1 pl-5 text-[12px] leading-[1.7] text-[var(--cosmos-text-dim)]">
          {description}
        </p>
      ) : null}
    </div>
  )
}

function ConnectLink({
  Icon,
  label,
  href,
  display,
  external,
}: {
  Icon: React.FC<React.SVGProps<SVGSVGElement> & { size?: number }>
  label: string
  href: string
  display: string
  external?: boolean
}) {
  const externalProps = external
    ? { target: '_blank', rel: 'noopener noreferrer' as const }
    : {}
  return (
    <li>
      <a
        href={href}
        {...externalProps}
        className="group inline-flex items-center gap-3 font-mono text-[13px] text-[var(--cosmos-text-muted)] transition-colors hover:text-[var(--cosmos-text)]"
      >
        <Icon
          size={14}
          aria-hidden
          className="shrink-0 text-[var(--cosmos-text-dim)] transition-colors group-hover:text-[var(--cosmos-accent)]"
        />
        <span className="text-[var(--cosmos-text)]">{label}</span>
        <span aria-hidden className="text-[var(--cosmos-text-dim)]">
          →
        </span>
        <span className="truncate">{display}</span>
      </a>
    </li>
  )
}

function stripScheme(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}
