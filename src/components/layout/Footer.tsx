import Link from 'next/link'

interface LinkDef {
  label: string
  href: string
  external?: boolean
}

interface Column {
  title: string
  links: LinkDef[]
}

const COLUMNS: Column[] = [
  {
    title: 'Platform',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Intelligence', href: '/intelligence' },
      { label: 'News', href: '/news' },
      { label: 'Scholarships', href: '/scholarships' },
      { label: 'Research', href: '/research' },
      { label: 'Resources', href: '/resources' },
      { label: 'Tools', href: '/tools' },
    ],
  },
  {
    title: 'Connect',
    links: [
      {
        label: 'GitHub',
        href: 'https://github.com/IAZENT/',
        external: true,
      },
      {
        label: 'LinkedIn',
        href: 'https://www.linkedin.com/in/rupesh-thakur-aa98702a7/',
        external: true,
      },
      {
        label: 'Email',
        href: 'mailto:rupeshkthakur7@gmail.com',
        external: true,
      },
    ],
  },
]

function FooterLink({ link }: { link: LinkDef }) {
  const className =
    'inline-block font-mono text-[12px] leading-[1.6] text-[var(--cosmos-text-muted)] transition-colors hover:text-[var(--cosmos-text)] focus-visible:text-[var(--cosmos-text)] focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-4'
  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {link.label}
      </a>
    )
  }
  return (
    <Link href={link.href} prefetch={false} className={className}>
      {link.label}
    </Link>
  )
}

function ColumnList({ column }: { column: Column }) {
  return (
    <section aria-labelledby={`footer-col-${column.title.toLowerCase()}`}>
      <h3
        id={`footer-col-${column.title.toLowerCase()}`}
        className="mb-4 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]"
      >
        {column.title}
      </h3>
      <ul className="flex flex-col gap-2">
        {column.links.map((link) => (
          <li key={`${column.title}-${link.href}`}>
            <FooterLink link={link} />
          </li>
        ))}
      </ul>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-[var(--cosmos-border-dim)] bg-[var(--cosmos-bg)]">
      <div className="mx-auto max-w-cosmos px-4 py-12 sm:px-6 sm:py-16 md:px-12">
        {/*
         * Adaptive grid: `auto-fit` with a minimum column width of
         * 180px makes the layout flow purely on available space  on
         * a wide window all four cells sit in one row, on a narrow
         * tablet they wrap to 2x2, and on a phone they collapse to a
         * single vertical stack. This adapts to *container* width,
         * not just viewport width, so the footer also reflows
         * correctly inside any embedded contexts.
         */}
        <div
          className="grid gap-x-8 gap-y-10"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}
        >
          <div className="min-w-0">
            <Link
              href="/"
              prefetch={false}
              className="inline-block font-mono text-[14px] tracking-[0.04em] text-[var(--cosmos-text)] transition-colors hover:text-[var(--cosmos-accent)]"
            >
              ./cosmos
            </Link>
            <p className="mt-4 max-w-xs text-[12px] leading-relaxed text-[var(--cosmos-text-muted)]">
              Cybersecurity intelligence, research, and operational
              infrastructure.
            </p>
          </div>
          {COLUMNS.map((c) => (
            <ColumnList key={c.title} column={c} />
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-[var(--cosmos-border-dim)] pt-6 sm:mt-16">
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
