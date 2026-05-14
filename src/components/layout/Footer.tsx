import Link from 'next/link'
import { SOCIAL_LINKS, emailHref } from '@/lib/config/social'

interface LinkDef {
  label: string
  href: string
  external?: boolean
}

const PLATFORM_LINKS: LinkDef[] = [
  { label: 'Home', href: '/' },
  { label: 'Intelligence', href: '/intelligence' },
  { label: 'News', href: '/news' },
  { label: 'Digest', href: '/digest' },
  { label: 'Scholarships', href: '/scholarships' },
  { label: 'Writings', href: '/research' },
  { label: 'Resources', href: '/resources' },
  { label: 'Arsenal', href: '/arsenal' },
  { label: 'Tools', href: '/tools' },
  { label: 'About', href: '/about' },
]

const CONNECT_LINKS: LinkDef[] = [
  { label: 'GitHub', href: SOCIAL_LINKS.github, external: true },
  { label: 'LinkedIn', href: SOCIAL_LINKS.linkedin, external: true },
  { label: 'Email', href: emailHref(SOCIAL_LINKS.email), external: true },
]

const linkClass =
  'inline-block font-mono text-[12px] leading-[1.7] text-[var(--cosmos-text-muted)] transition-colors hover:text-[var(--cosmos-text)] focus-visible:text-[var(--cosmos-text)] focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-4'

function FooterLink({ link }: { link: LinkDef }) {
  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        {link.label}
      </a>
    )
  }
  return (
    <Link href={link.href} prefetch={false} className={linkClass}>
      {link.label}
    </Link>
  )
}

function ColumnHeading({ id, label }: { id: string; label: string }) {
  return (
    <h3
      id={id}
      className="mb-4 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]"
    >
      {label}
    </h3>
  )
}

/**
 * Footer.
 *
 * Layout strategy:
 *
 * 1.  Three top-level sections (Brand · Platform · Connect) sit in a single
 *     CSS grid. Outer gap is intentionally large (`gap-x-12 md:gap-x-20`)
 *     so neighbours never visually fuse when Platform's inner list flows
 *     into multiple sub-columns.
 *
 * 2.  Platform's links live in a CSS multi-column container with
 *     `column-width: 130px` and `column-gap: 28px`  narrower than the
 *     outer grid gap, so a Platform link in column-2 cannot ever appear
 *     "closer to Connect" than to its own heading. The heading stays
 *     anchored above the multi-column block.
 *
 * 3.  Container queries (`@container`) collapse the three sections to
 *     a single column on narrow viewports, and the Platform list itself
 *     adapts from 1 → 2 → 3 sub-columns purely on available space.
 */
export function Footer() {
  return (
    <footer className="cosmos-footer border-t border-[var(--cosmos-border-dim)] bg-[var(--cosmos-bg)]">
      <div className="mx-auto max-w-cosmos px-4 py-10 sm:px-6 sm:py-12 md:px-12 md:py-14">
        <div className="grid grid-cols-1 gap-x-12 gap-y-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)_minmax(0,1fr)] md:gap-x-20">
          {/* Brand */}
          <div className="min-w-0">
            <Link
              href="/"
              prefetch={false}
              className="inline-block font-mono text-[14px] tracking-[0.04em] text-[var(--cosmos-text)] transition-colors hover:text-[var(--cosmos-accent)]"
            >
              ./cosmos
            </Link>
            <p className="mt-3 max-w-xs text-[12px] leading-relaxed text-[var(--cosmos-text-muted)]">
              Cybersecurity intelligence, research, and operational
              infrastructure.
            </p>
          </div>

          {/* Platform  adaptive multi-column flow */}
          <section
            aria-labelledby="footer-col-platform"
            className="min-w-0"
          >
            <ColumnHeading id="footer-col-platform" label="Platform" />
            <ul
              className="cosmos-footer-cols"
              style={{
                columnWidth: '130px',
                columnGap: '28px',
                columnFill: 'balance',
              }}
            >
              {PLATFORM_LINKS.map((link) => (
                <li key={link.href} className="break-inside-avoid">
                  <FooterLink link={link} />
                </li>
              ))}
            </ul>
          </section>

          {/* Connect */}
          <section
            aria-labelledby="footer-col-connect"
            className="min-w-0"
          >
            <ColumnHeading id="footer-col-connect" label="Connect" />
            <ul className="flex flex-col gap-1">
              {CONNECT_LINKS.map((link) => (
                <li key={link.href}>
                  <FooterLink link={link} />
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-[var(--cosmos-border-dim)] pt-5">
          <span className="font-mono text-[11px] text-[var(--cosmos-text-dim)]">
            © {new Date().getUTCFullYear()} COSMOS. Built in public.
          </span>
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--cosmos-low)]"
            />
            {'// all systems operational'}
          </span>
        </div>
      </div>
    </footer>
  )
}
