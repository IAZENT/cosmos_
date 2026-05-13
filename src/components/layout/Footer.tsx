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
      { label: 'Intelligence', href: '/intelligence' },
      { label: 'Research', href: '/research' },
      { label: 'Resources', href: '/resources' },
      { label: 'Tools', href: '/tools' },
    ],
  },
  {
    title: 'Research',
    links: [
      { label: 'Writeups', href: '/research' },
      { label: 'Malware', href: '/research?category=malware' },
      { label: 'DFIR', href: '/research?category=dfir' },
      { label: 'RE Notes', href: '/research?category=re' },
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

function ColumnList({ column }: { column: Column }) {
  return (
    <div>
      <h3 className="mb-4 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
        {column.title}
      </h3>
      <ul className="flex flex-col gap-2">
        {column.links.map((link) => (
          <li key={`${column.title}-${link.href}`}>
            {link.external ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[12px] text-[var(--cosmos-text-muted)] transition-colors hover:text-[var(--cosmos-text)]"
              >
                {link.label}
              </a>
            ) : (
              <Link
                href={link.href}
                className="font-mono text-[12px] text-[var(--cosmos-text-muted)] transition-colors hover:text-[var(--cosmos-text)]"
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-[var(--cosmos-border-dim)] bg-[var(--cosmos-bg)]">
      <div className="mx-auto max-w-cosmos px-4 py-12 sm:px-6 sm:py-16 md:px-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <Link
              href="/"
              className="font-mono text-[14px] text-[var(--cosmos-text)]"
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

        <div className="mt-16 flex flex-col items-start justify-between gap-3 border-t border-[var(--cosmos-border-dim)] pt-6 md:flex-row md:items-center">
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
