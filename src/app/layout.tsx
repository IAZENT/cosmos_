import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { CommandPaletteMount } from '@/components/layout/CommandPaletteMount'
import { CursorEffect } from '@/components/layout/CursorEffect'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: {
    default: 'COSMOS',
    template: '%s | COSMOS',
  },
  description:
    'Cybersecurity intelligence, research, and operational infrastructure.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'COSMOS',
    description:
      'Cybersecurity intelligence, research, and operational infrastructure.',
    type: 'website',
  },
  alternates: {
    types: {
      'application/atom+xml': '/feed.xml',
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="bg-[var(--cosmos-bg)] text-[var(--cosmos-text)] font-sans antialiased">
        {children}
        <CommandPaletteMount />
        <CursorEffect />
      </body>
    </html>
  )
}
