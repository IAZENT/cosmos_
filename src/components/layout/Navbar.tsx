'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils/cn'

const NAV_LINKS: { label: string; href: string }[] = [
  { label: 'Intelligence', href: '/intelligence' },
  { label: 'News', href: '/news' },
  { label: 'Research', href: '/research' },
  { label: 'Resources', href: '/resources' },
  { label: 'Tools', href: '/tools' },
]

function LiveIndicator() {
  return (
    <span className="flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--cosmos-low)] opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--cosmos-low)]" />
      </span>
      <span className="font-mono text-[10px] tracking-[0.1em] text-[var(--cosmos-text-dim)]">
        LIVE
      </span>
    </span>
  )
}

export function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header
      className="sticky top-0 z-40 border-b border-[var(--cosmos-border-dim)] bg-[var(--cosmos-bg)]/90 backdrop-blur"
      aria-label="Primary"
    >
      <div className="mx-auto flex h-14 max-w-cosmos items-center justify-between px-4 sm:px-6 md:px-12">
        <Link
          href="/"
          className="font-mono text-[14px] tracking-[0.04em] text-[var(--cosmos-text)] transition-colors hover:text-[var(--cosmos-accent)]"
        >
          ./cosmos
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {NAV_LINKS.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'font-mono text-[12px] uppercase tracking-[0.08em] transition-colors',
                  active
                    ? 'text-[var(--cosmos-text)]'
                    : 'text-[var(--cosmos-text-muted)] hover:text-[var(--cosmos-text)]',
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="hidden md:block">
          <LiveIndicator />
        </div>

        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="cosmos-mobile-menu"
          className="-mr-2 flex h-11 w-11 items-center justify-center text-[var(--cosmos-text-muted)] md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open ? (
        <div
          id="cosmos-mobile-menu"
          className="border-t border-[var(--cosmos-border-dim)] md:hidden"
        >
          <nav
            className="mx-auto flex max-w-cosmos flex-col gap-1 px-4 py-4 sm:px-6"
            aria-label="Mobile"
          >
            {NAV_LINKS.map((link) => {
              const active =
                pathname === link.href || pathname.startsWith(`${link.href}/`)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'py-2 font-mono text-[12px] uppercase tracking-[0.08em]',
                    active
                      ? 'text-[var(--cosmos-text)]'
                      : 'text-[var(--cosmos-text-muted)]',
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
            <div className="pt-3">
              <LiveIndicator />
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
